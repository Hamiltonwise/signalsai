import { useState, useEffect } from 'react';
import { getMTDComparison, calculateMTDChange, getLast30DaysComparison, type MTDComparison } from '../utils/dateUtils';
import { supabase } from '../lib/supabaseClient';

interface GSCMetrics {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averagePosition: number;
  totalQueries: number;
  calculatedScore: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
}

interface GSCSite {
  id: string;
  displayName: string;
  permissionLevel: string;
}

export const useGSCIntegration = (clientId: string, ready: boolean, session: any) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<GSCMetrics | null>(null);
  const [sites, setSites] = useState<GSCSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<MTDComparison | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Enhanced site selection with persistence and validation
  const setSelectedSiteWithPersistence = (siteUrl: string) => {
    setSelectedSite(siteUrl);
    
    // Persist to localStorage with client-specific key
    if (clientId && siteUrl) {
      const storageKey = `gsc_selected_site_${clientId}`;
      localStorage.setItem(storageKey, siteUrl);
    }
    
    // Clear any existing metrics when site changes
    setMetrics(null);
    setError(null);
  };

  // Load persisted site selection on mount
  useEffect(() => {
    if (clientId && isConnected && sites.length > 0) {
      const storedSite = localStorage.getItem(`gsc_selected_site_${clientId}`);
      
      // Check if stored site exists in available sites
      const siteExists = sites.find(s => s.id === storedSite);
      
      if (storedSite && sites.find(s => s.id === storedSite)) {
        setSelectedSite(storedSite);
      } else if (storedSite && !siteExists) {
        localStorage.removeItem(`gsc_selected_site_${clientId}`);
      } else if (sites.length === 1) {
        // Auto-select if only one site available
        setSelectedSiteWithPersistence(sites[0].id);
      }
    }
  }, [clientId, isConnected, sites]);

  // Check if GSC is connected by looking for URL params or stored state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gscAuth = urlParams.get('gsc_auth');
    const sitesParam = urlParams.get('sites');
    const isPopup = urlParams.get('popup') === 'true';
    
    if (gscAuth === 'success' && sitesParam) {
      try {
        const parsedSites = JSON.parse(decodeURIComponent(sitesParam));
        setSites(parsedSites);
        setIsConnected(true);
        setError(null);
        
        // Store connection state
        localStorage.setItem(`gsc_connected_${clientId}`, 'true');
        localStorage.setItem(`gsc_sites_${clientId}`, JSON.stringify(parsedSites));
        
        // If this is a popup redirect, close the popup and notify parent
        if (isPopup && window.opener) {
          window.opener.postMessage({
            type: 'GSC_AUTH_SUCCESS',
            sites: parsedSites
          }, '*');
          window.close();
          return;
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error parsing sites:', err);
        setError('Failed to parse GSC sites');
      }
    } else if (gscAuth === 'error' && isPopup && window.opener) {
      // Handle error in popup
      const errorMessage = urlParams.get('message') || 'Unknown error';
      window.opener.postMessage({
        type: 'GSC_AUTH_ERROR',
        error: errorMessage
      }, '*');
      window.close();
      return;
    } else {
      // Check if we have stored connection state
      const storedConnection = localStorage.getItem(`gsc_connected_${clientId}`);
      const storedSites = localStorage.getItem(`gsc_sites_${clientId}`);
      
      if (storedConnection === 'true' && storedSites) {
        try {
          const parsedSites = JSON.parse(storedSites);
          setSites(parsedSites);
          setIsConnected(true);
        } catch (err) {
          console.error('Error parsing stored sites:', err);
        }
      }
    }
  }, [clientId]);

  // Auto-fetch data when connected and site is selected
  useEffect(() => {
    // Gate all fetches behind auth readiness
    if (!ready || !session) return;
    
    if (isConnected && selectedSite && clientId) {
      console.log('🔍 GSC: Auto-fetching data for site:', selectedSite);
      console.log('🔍 GSC: Client ID:', clientId);
      
      // Use last 30 days for detailed analytics
      const last30Days = getLast30DaysComparison();
      setCurrentDateRange(last30Days);
      console.log('🔍 GSC: Using last 30 days range:', last30Days.current);
      
      // Fetch data for any selected site
      fetchAndStoreGSCData(selectedSite, last30Days.current.startDate, last30Days.current.endDate)
        .then(() => {
          console.log('🔍 GSC: Data fetch completed, now getting metrics...');
          return getStoredGSCMetrics(last30Days.current.startDate, last30Days.current.endDate);
        })
        .then((metricsData) => {
          console.log('🔍 GSC: Metrics retrieved successfully:', metricsData);
        })
        .catch((error) => {
          console.error('🔍 GSC: Auto-fetch failed:', error);
        });
    }
  }, [ready, session, isConnected, selectedSite, clientId]);

  const refreshWithLast30Days = async () => {
    if (selectedSite) {
      const mtdComparison = getMTDComparison();
      setCurrentDateRange(mtdComparison);
      return fetchAndStoreGSCData(selectedSite, mtdComparison.current.startDate, mtdComparison.current.endDate)
        .then(() => getStoredGSCMetrics(mtdComparison.current.startDate, mtdComparison.current.endDate));
    }
  };
  const initiateGSCConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate we have auth session
      if (!ready || !session) {
        throw new Error('No active session. Please sign in first.');
      }

      // Call GSC auth function directly - client ID resolved server-side
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('No active session. Please sign in first.');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/gsc-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const data = await response.json();
      if (!data.success || !data.authUrl) {
        throw new Error('No auth URL received');
      }

      // Open popup and navigate to auth URL
      const popup = window.open('', 'gsc_connect', 'width=520,height=700,scrollbars=yes,resizable=yes');
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      popup.location.href = data.authUrl;
      
      setIsConnected(true);
      
      // Store connection state
      if (data.clientId) {
        localStorage.setItem(`gsc_connected_${data.clientId}`, 'true');
      }

    } catch (error) {
      console.error('GSC connection error:', error);
      let errorMessage = 'Failed to initiate GSC connection';
      
      if (error instanceof Error) {
        if (error.message.includes('Popup blocked')) {
          errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
        } else if (error.message.includes('Popup timed out')) {
          errorMessage = 'Connection timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGSCSites = async () => {
    try {
      // Fetch sites from stored credentials
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gsc-sites?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sites) {
          setSites(data.sites);
          
          // Store sites
          if (clientId) {
            localStorage.setItem(`gsc_sites_${clientId}`, JSON.stringify(data.sites));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching GSC sites:', error);
    }
  };

  // Listen for popup messages from the gsc-callback function
  useEffect(() => {
    // Only set up listener if we have a valid clientId
    if (!clientId) {
      return;
    }
    
    const messageListener = (event: MessageEvent) => {
      // Only process messages from our own popups
      if (!event.data || typeof event.data !== 'object') return;
      
      console.log('GSC Integration: Received message', event.data);
      
      if (event.data.type === 'GSC_AUTH_SUCCESS') {
        console.log('GSC Integration: Processing AUTH_SUCCESS', {
          sitesCount: event.data.sites?.length || 0
        });
        
        const parsedSites = event.data.sites;
        setSites(parsedSites);
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        
        // Store connection state
        localStorage.setItem(`gsc_connected_${clientId}`, 'true');
        localStorage.setItem(`gsc_sites_${clientId}`, JSON.stringify(parsedSites));
        
        console.log('GSC Integration: Connection state updated');
        
        // Auto-select Hamilton Wise or Tricity site if available
        const practicesite = parsedSites.find(s => 
          s.displayName.toLowerCase().includes('hamiltonwise') ||
          s.displayName.toLowerCase().includes('tricity')
        );
        if (practicesite) {
          console.log('Auto-selecting practice site:', practicesite.displayName);
          setSelectedSiteWithPersistence(practicesite.id);
        } else if (parsedSites.length === 1) {
          setSelectedSiteWithPersistence(parsedSites[0].id);
        }
      } else if (event.data.type === 'GSC_AUTH_ERROR') {
        console.log('GSC Integration: Processing AUTH_ERROR', event.data.error);
        setError(`GSC connection failed: ${event.data.error}`);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', messageListener);
    
    return () => {
    }
  }
  )

  const getStoredGSCMetrics = async (startDate: string, endDate: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);
      console.log('🔍 GSC: Getting stored metrics for:', { clientId, startDate, endDate });

      // Validate environment variables
      if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }
      
      if (!SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/gsc-metrics?clientId=${clientId}&startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('🔍 GSC: Metrics response status:', response.status);

      const responseText = await response.text();
      console.log('🔍 GSC: Metrics response text preview:', responseText.substring(0, 200));
      
      if (!response.ok) {
        console.error('🔍 GSC: Metrics fetch failed:', response.status, responseText);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔍 GSC: Failed to parse metrics response:', responseText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
      
      console.log('🔍 GSC: Parsed metrics data:', data);
      
      if (data.rawData && data.rawData.length > 0) {
        console.log('🔍 GSC: Sample raw record:', data.rawData[0]);
        const totalClicksFromRaw = data.rawData.reduce((sum, record) => sum + (record.clicks || 0), 0);
        const totalImpressionsFromRaw = data.rawData.reduce((sum, record) => sum + (record.impressions || 0), 0);
        console.log('🔍 GSC: Manual aggregation from raw data:', {
          totalClicks: totalClicksFromRaw,
          totalImpressions: totalImpressionsFromRaw
        });
        
        // Validate data consistency
        if (data.data.totalClicks !== totalClicksFromRaw) {
          console.error('🔍 GSC: DATA INCONSISTENCY - Aggregated clicks do not match raw data sum');
          console.error('🔍 GSC: Aggregated:', data.data.totalClicks, 'Raw sum:', totalClicksFromRaw);
        }
      }
      
      if (data.success && data.data) {
        console.log('🔍 GSC: Setting real metrics from stored data:', data.data);
        
        // Enhanced validation with automatic fallback
        if (data.data.totalClicks === 0 && data.rawData && data.rawData.length > 0) {
          console.error('❌ GSC AGGREGATION FAILURE: Edge Function returned 0 clicks but raw data exists');
          console.error('❌ This indicates a critical parsing issue in gsc-metrics function');
          console.log('🔍 GSC: Raw data diagnostic:', data.rawData.slice(0, 3).map(r => ({
            clicks: r.clicks,
            impressions: r.impressions,
            clicksType: typeof r.clicks,
            impressionsType: typeof r.impressions,
            clicksParsed: parseInt(String(r.clicks)) || 0,
            impressionsParsed: parseInt(String(r.impressions)) || 0,
            clicksIsValid: !isNaN(parseInt(String(r.clicks))),
            impressionsIsValid: !isNaN(parseInt(String(r.impressions)))
          })));
          
          console.log('🔍 GSC: Attempting manual aggregation as fallback...');
          
          // Calculate manual aggregation with proper number conversion
          const totalImpressions = data.rawData.reduce((sum, record) => sum + (parseInt(String(record.impressions)) || 0), 0);
          const totalClicks = data.rawData.reduce((sum, record) => sum + (parseInt(String(record.clicks)) || 0), 0);
          const totalCTR = data.rawData.reduce((sum, record) => sum + (parseFloat(String(record.ctr)) || 0), 0);
          const totalPosition = data.rawData.reduce((sum, record) => sum + (parseFloat(String(record.position)) || 0), 0);
          
          console.log('🔍 GSC: Manual aggregation totals:', {
            totalImpressions,
            totalClicks,
            averageCTR: data.rawData.length > 0 ? (totalCTR / data.rawData.length) * 100 : 0,
            averagePosition: data.rawData.length > 0 ? totalPosition / data.rawData.length : 0
          });
          
          const manualMetrics = {
            totalImpressions,
            totalClicks,
            averageCTR: data.rawData.length > 0 ? (totalCTR / data.rawData.length) * 100 : 0,
            averagePosition: data.rawData.length > 0 ? totalPosition / data.rawData.length : 0,
            totalQueries: new Set(data.rawData.map(r => r.query).filter(Boolean)).size,
            calculatedScore: data.data.calculatedScore || 0,
            trend: data.data.trend || 'stable',
            changePercent: data.data.changePercent || '0'
          };
          
          if (manualMetrics.totalClicks > 0) {
            console.log('✅ GSC: Manual aggregation successful - clicks recovered:', manualMetrics.totalClicks);
          } else {
            console.error('❌ GSC: Manual aggregation also failed - raw data may be corrupted');
          }
          
          setMetrics(manualMetrics);
          return manualMetrics;
        }
        
        setMetrics(data.data);
        return data.data;
      } else {
        console.warn('🔍 GSC: No metrics data returned, using defaults');
        const defaultMetrics: GSCMetrics = {
          totalImpressions: 0,
          totalClicks: 0,
          averageCTR: 0,
          averagePosition: 0,
          totalQueries: 0,
          calculatedScore: 0,
          trend: 'stable',
          changePercent: '0'
        };
        setMetrics(defaultMetrics);
        return defaultMetrics;
      }
      
    } catch (err) {
      console.error('🔍 GSC: Error in getStoredGSCMetrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to get GSC metrics');
      
      // Return default metrics on error
      const defaultMetrics: GSCMetrics = {
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0,
        averagePosition: 0,
        totalQueries: 0,
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

  const fetchAndStoreGSCData = async (siteUrl: string, startDate: string, endDate: string) => {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);

      console.log('🔍 GSC: Fetching and storing data for site:', siteUrl);
      console.log('🔍 GSC: Date range:', { startDate, endDate });
      console.log('🔍 GSC: Client ID:', clientId);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gsc-fetch-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, siteUrl, startDate, endDate })
      });

      console.log('🔍 GSC: Fetch response status:', response.status);
      
      const responseText = await response.text();
      console.log('🔍 GSC: Fetch response text preview:', responseText.substring(0, 200));

      if (!response.ok) {
        console.error('🔍 GSC: Fetch failed:', response.status, responseText);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔍 GSC: Failed to parse fetch response:', responseText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
      
      console.log('🔍 GSC: Fetch data response:', data);
      console.log('🔍 GSC: Fetch success:', data.success);
      console.log('🔍 GSC: Processed data count:', data.data?.length || 0);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch and store GSC data');
      }
      
      return data;
    } catch (err) {
      console.error('Error in fetchAndStoreGSCData:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch and store GSC data');
      throw err;
    } finally {
      setIsLoading(false);
      setIsLoading(false);
    }
  };

  const formatMetricsForDisplay = (metrics: GSCMetrics) => {
    if (!metrics || typeof metrics !== 'object') {
      return {
        title: "Search Performance",
        value: "0",
        trend: "stable" as const,
        trendValue: "0%",
        metrics: []
      };
    }

    return {
      title: "Search Performance",
      value: (metrics.totalClicks || 0).toLocaleString(),
      trend: metrics.trend || 'stable',
      trendValue: `${(metrics.trend || 'stable') === 'up' ? '+' : (metrics.trend || 'stable') === 'down' ? '-' : ''}${metrics.changePercent || '0'}%`,
      metrics: [
        { label: "Impressions", value: (metrics.totalImpressions || 0).toLocaleString(), trend: metrics.trend || 'stable' },
        { label: "Avg. CTR", value: `${(metrics.averageCTR || 0).toFixed(2)}%`, trend: metrics.trend || 'stable' },
        { label: "Avg. Position", value: (metrics.averagePosition || 0).toFixed(1), trend: (metrics.trend || 'stable') === 'up' ? 'down' : (metrics.trend || 'stable') === 'down' ? 'up' : 'stable' },
        { label: "Total Queries", value: (metrics.totalQueries || 0).toLocaleString(), trend: metrics.trend || 'stable' }
      ]
    };
  };

  return {
    isConnected,
    isLoading,
    metrics,
    sites,
    selectedSite,
    error,
    setSelectedSite: setSelectedSiteWithPersistence,
    initiateGSCConnection,
    fetchGSCData: fetchAndStoreGSCData,
    getStoredGSCMetrics,
    fetchAndStoreGSCData,
    formatMetricsForDisplay,
    // Add method to manually trigger data fetch
    refreshData: refreshWithLast30Days,
    currentDateRange,
    getLast30DaysComparison: () => getLast30DaysComparison()
  };
};