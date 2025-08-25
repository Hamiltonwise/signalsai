import { useState, useEffect } from 'react';
import { getMTDComparison, calculateMTDChange, getLast30DaysComparison, type MTDComparison } from '../utils/dateUtils';
import { useAuthReady } from './useAuthReady';

interface ClarityMetrics {
  totalSessions: number;
  uniqueUsers: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  deadClicks: number;
  rageClicks: number;
  quickBacks: number;
  calculatedScore: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
}

export const useClarityIntegration = (clientId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<ClarityMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<MTDComparison | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if Clarity is connected by looking for stored credentials
  useEffect(() => {
    const checkConnection = async () => {
      if (!clientId) return;

      try {
        // Check if we have stored Clarity credentials
        const storedConnection = localStorage.getItem(`clarity_connected_${clientId}`);
        if (storedConnection === 'true') {
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error checking Clarity connection:', err);
      }
    };

    checkConnection();
  }, [clientId]);

  // Listen for popup messages (for future OAuth implementation)
  useEffect(() => {
    // Only set up listener if we have a valid clientId
    if (!clientId) {
      return;
    }
    
    const messageListener = (event: MessageEvent) => {
      // Only process messages from our own popups
      if (!event.data || typeof event.data !== 'object') return;
      
      if (event.data.type === 'CLARITY_AUTH_SUCCESS') {
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        
        // Store connection state
        localStorage.setItem(`clarity_connected_${clientId}`, 'true');
      } else if (event.data.type === 'CLARITY_AUTH_ERROR') {
        setError(`Clarity connection failed: ${event.data.error}`);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', messageListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [clientId]);
  // Auto-fetch data when connected
  useEffect(() => {
    if (isConnected && clientId) {
      // Use last 30 days for detailed analytics
      const last30Days = getLast30DaysComparison();
      setCurrentDateRange(last30Days);
      
      console.log('Auto-fetching Clarity data');
      console.log('Using last 30 days range:', last30Days.current);
      fetchClarityData(last30Days.current.startDate, last30Days.current.endDate)
        .then(() => getClarityMetrics(last30Days.current.startDate, last30Days.current.endDate))
        .catch(console.error);
    }
  }, [isConnected, clientId]);

  const refreshWithLast30Days = async () => {
    const last30Days = getLast30DaysComparison();
    setCurrentDateRange(last30Days);
    console.log('Refreshing Clarity with last 30 days range:', last30Days.current);
    return fetchClarityData(last30Days.current.startDate, last30Days.current.endDate)
      .then(() => getClarityMetrics(last30Days.current.startDate, last30Days.current.endDate));
  };

  const fetchClarityData = async (startDate: string, endDate: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);

      console.log('=== Clarity Data Fetch Started ===');
      console.log('Fetching Clarity data for:', { clientId, startDate, endDate });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/clarity-fetch-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, startDate, endDate })
      });

      console.log('Clarity fetch response status:', response.status);
      
      const data = await response.json();
      console.log('Clarity fetch response data:', data);
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch Clarity data');
      
      return data;
    } catch (err) {
      console.error('Error in fetchClarityData:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Clarity data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getClarityMetrics = async (startDate: string, endDate: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);

      console.log('=== Clarity Metrics Retrieval Debug ===');
      console.log('Getting Clarity metrics for:', { clientId, startDate, endDate });

      // Validate environment variables
      if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }
      
      if (!SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set');
      }

      const url = `${SUPABASE_URL}/functions/v1/clarity-metrics?clientId=${encodeURIComponent(clientId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('Clarity metrics response status:', response.status);

      const data = await response.json();
      console.log('Clarity metrics response:', data);
      
      if (!response.ok) throw new Error(data.error || 'Failed to get Clarity metrics');
      
      setMetrics(data.data);
      return data.data;
    } catch (err) {
      console.error('Error in getClarityMetrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to get Clarity metrics');
      
      // Return default metrics on error
      const defaultMetrics: ClarityMetrics = {
        totalSessions: 0,
        uniqueUsers: 0,
        pageViews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        deadClicks: 0,
        rageClicks: 0,
        quickBacks: 0,
        calculatedScore: 0,
        trend: 'stable',
        changePercent: '0'
      };
      setMetrics(defaultMetrics);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const formatMetricsForDisplay = (metrics: ClarityMetrics) => {
    if (!metrics) {
      return {
        title: "User Experience",
        value: "0",
        trend: "stable" as const,
        trendValue: "0%",
        metrics: []
      };
    }

    return {
      title: "User Experience",
      value: metrics.totalSessions.toLocaleString(),
      trend: metrics.trend,
      trendValue: `${metrics.trend === 'up' ? '+' : metrics.trend === 'down' ? '-' : ''}${metrics.changePercent}%`,
      metrics: [
        { label: "Unique Users", value: metrics.uniqueUsers.toLocaleString(), trend: metrics.trend },
        { label: "Bounce Rate", value: `${metrics.bounceRate.toFixed(1)}%`, trend: metrics.trend === 'up' ? 'down' : metrics.trend === 'down' ? 'up' : 'stable' },
        { label: "Dead Clicks", value: metrics.deadClicks.toLocaleString(), trend: metrics.trend === 'up' ? 'down' : metrics.trend === 'down' ? 'up' : 'stable' },
        { label: "Avg. Session", value: `${Math.floor(metrics.avgSessionDuration / 60)}:${Math.floor(metrics.avgSessionDuration % 60).toString().padStart(2, '0')}`, trend: metrics.trend }
      ]
    };
  };

  const connectClarity = async (apiToken: string, projectId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/clarity-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, apiToken, projectId })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to connect Clarity');
      
      // Mark as connected
      localStorage.setItem(`clarity_connected_${clientId}`, 'true');
      setIsConnected(true);
      
      console.log('Clarity connected successfully, connection state updated');
      
      // After successful connection, fetch initial data
      console.log('Fetching initial Clarity data...');
      const mtdComparison = getMTDComparison();
      await fetchClarityData(mtdComparison.current.startDate, mtdComparison.current.endDate);
      await getClarityMetrics(mtdComparison.current.startDate, mtdComparison.current.endDate);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Clarity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    metrics,
    error,
    getClarityMetrics,
    connectClarity,
    formatMetricsForDisplay,
    refreshData: refreshWithLast30Days,
    fetchClarityData,
    currentDateRange,
    getLast30DaysComparison: () => getLast30DaysComparison()
  };
};