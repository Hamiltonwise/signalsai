import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calculateMTDChange } from '../utils/dateUtils';
import { authFetch } from '../lib/authFetch';

interface PMSMetrics {
  totalPatients: number; // Now represents total referral events
  selfReferred: number;
  drReferred: number;
  totalProduction: number; // Renamed from totalRevenue
  averageProductionPerPatient: number; // Average production per referral event
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
  previousPeriodProduction: number;
  previousPeriodPatients: number;
  productionChange: number;
  patientsChange: number;
  comparisonPeriod: string;
  monthlyData: Array<{
    month: string;
    selfReferred: number; // Count of self-referred patients for the month
    drReferred: number; // Count of doctor-referred patients for the month
    totalPatientsMonth: number; // Total patients (referral events) for the month
    production: number; // Total production for the month
  }>;
}

export const usePMSData = (clientId: string, ready: boolean, session: any) => {
  const effectiveClientId = clientId;
  const [metrics, setMetrics] = useState<PMSMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Get full month comparison periods (last month vs 2 months ago)
  const getFullMonthComparison = () => {
    const now = new Date();
    
    // Last month (full month)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of last month
    
    // Two months ago (full month)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0); // Last day of two months ago
    
    console.log('=== Full Month Comparison Periods ===');
    console.log('Current month:', now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('Last month (current):', lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('Two months ago (previous):', twoMonthsAgo.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    return {
      current: {
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0],
        label: lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      previous: {
        startDate: twoMonthsAgo.toISOString().split('T')[0],
        endDate: twoMonthsAgoEnd.toISOString().split('T')[0],
        label: twoMonthsAgo.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    };
  };
  const fetchPMSMetrics = async (startDate: string, endDate: string) => {
    try {
      // Gate fetch behind auth readiness
      if (!ready || !session) {
        console.log('PMS: Waiting for auth ready state');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      console.log('=== PMS Metrics Fetch Debug ===');
      console.log('Client ID:', effectiveClientId);
      console.log('Date range:', { startDate, endDate });
      console.log('Has Anon Key:', !!SUPABASE_ANON_KEY);

      // Validate environment variables
      if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set. Please add it to your .env file or Netlify environment variables.');
      }
      
      if (!SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set. Please add it to your .env file or Netlify environment variables.');
      }
      
      // Validate URL format
      if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
        throw new Error(`Invalid VITE_SUPABASE_URL format: "${SUPABASE_URL}". Expected format: https://your-project-ref.supabase.co`);
      }

      // Use MTD comparison for accurate month-over-month tracking
      const fullMonthComparison = getFullMonthComparison();
      console.log('PMS: Using full month comparison:', fullMonthComparison);

      // Fetch current period data
      // Call the PMS metrics Supabase Edge Function
      const currentUrl = `${SUPABASE_URL}/functions/v1/pms-metrics?clientId=${encodeURIComponent(effectiveClientId)}&startDate=${encodeURIComponent(fullMonthComparison.current.startDate)}&endDate=${encodeURIComponent(fullMonthComparison.current.endDate)}`;
      
      console.log('PMS: Making current period request to:', currentUrl);
      
      const currentResponse = await authFetch(currentUrl);

      console.log('PMS: Current period response status:', currentResponse.status);

      // Read response text only once to avoid "body stream already read" error
      let responseText;
      try {
        responseText = await currentResponse.text();
      } catch (e) {
        throw new Error(`Failed to read response: ${e.message}`);
      }

      console.log('PMS: Response text (first 200 chars):', responseText.substring(0, 200));

      // Check if response is HTML (indicates wrong endpoint)
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error(`Environment variable error: VITE_SUPABASE_URL is incorrectly configured. Current value: "${SUPABASE_URL}". Please set it to your Supabase project URL (https://your-project-ref.supabase.co)`);
      }

      if (!currentResponse.ok) {
        if (currentResponse.status === 404) {
          throw new Error('PMS metrics function not found. Please ensure Supabase Edge Functions are deployed.');
        }
        
        if (currentResponse.status === 500) {
          throw new Error(`Server error in PMS metrics function: ${responseText}`);
        }
        
        throw new Error(`HTTP ${currentResponse.status}: ${responseText || currentResponse.statusText}`);
      }

      let currentData;
      try {
        currentData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from PMS metrics function. Response was: ${responseText.substring(0, 100)}... Parse error: ${parseError.message}`);
      }

      console.log('PMS: Parsed current period data:', currentData);

      // Also fetch full year data for the monthly chart
      const currentDate = new Date();
      const yearStart = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const yearEnd = currentDate.toISOString().split('T')[0];
      
      console.log('PMS: Fetching full year data for monthly chart:', { yearStart, yearEnd });
      
      const yearUrl = `${SUPABASE_URL}/functions/v1/pms-metrics?clientId=${encodeURIComponent(effectiveClientId)}&startDate=${encodeURIComponent(yearStart)}&endDate=${encodeURIComponent(yearEnd)}`;
      
      const yearResponse = await authFetch(yearUrl);

      let yearData = currentData; // Fallback to current data
      if (yearResponse.ok) {
        const yearResponseText = await yearResponse.text();
        try {
          yearData = JSON.parse(yearResponseText);
          console.log('PMS: Full year data fetched:', yearData);
        } catch (e) {
          console.warn('PMS: Failed to parse year data, using current data');
        }
      }

      // Fetch previous period data for comparison
      const previousUrl = `${SUPABASE_URL}/functions/v1/pms-metrics?clientId=${encodeURIComponent(effectiveClientId)}&startDate=${encodeURIComponent(fullMonthComparison.previous.startDate)}&endDate=${encodeURIComponent(fullMonthComparison.previous.endDate)}`;
      
      console.log('PMS: Making previous period request to:', previousUrl);
      
      const previousResponse = await authFetch(previousUrl);

      let previousData = { data: { totalProduction: 0, totalPatients: 0 } };
      if (previousResponse.ok) {
        const prevResponseText = await previousResponse.text();
        try {
          previousData = JSON.parse(prevResponseText);
          console.log('PMS: Parsed previous period data:', previousData);
        } catch (e) {
          console.warn('PMS: Failed to parse previous period data, using defaults');
        }
      }

      // Use year data for monthly chart, current data for comparison metrics
      const dataForChart = yearData.success && yearData.data ? yearData.data : currentData.data;
      const dataForComparison = currentData.success && currentData.data ? currentData.data : null;
      
      if (dataForComparison) {
        // Calculate month-over-month changes
        const currentProduction = dataForComparison.totalProduction || 0;
        const previousProduction = previousData.data?.totalProduction || 0;
        const currentPatients = dataForComparison.totalPatients || 0;
        const previousPatients = previousData.data?.totalPatients || 0;

        const productionChange = calculateMTDChange(currentProduction, previousProduction);
        const patientsChange = calculateMTDChange(currentPatients, previousPatients);

        // Enhanced metrics with comparison data
        const enhancedMetrics = {
          ...dataForChart, // Use full year data for monthly chart
          comparisonPeriod: `${fullMonthComparison.current.label} vs ${fullMonthComparison.previous.label}`,
          previousPeriodProduction: previousProduction,
          previousPeriodPatients: previousPatients,
          productionChange: productionChange.changePercent,
          patientsChange: patientsChange.changePercent,
          trend: productionChange.trend,
          changePercent: productionChange.changeText.replace(/[+\-%]/g, ''),
          // Ensure monthly data from full year is included
          monthlyData: dataForChart.monthlyData || []
        };

        console.log('PMS: Enhanced metrics with MTD comparison:', enhancedMetrics);
        console.log('PMS: Monthly data for chart:', enhancedMetrics.monthlyData?.length || 0, 'months');
        setMetrics(enhancedMetrics);
        return enhancedMetrics;
      } else {
        console.log('PMS: No data found, using default metrics');
        // If no data found, return default metrics
        const defaultMetrics: PMSMetrics = {
          totalPatients: 0,
          selfReferred: 0,
          drReferred: 0,
          totalProduction: 0,
          averageProductionPerPatient: 0,
          trend: 'stable',
          changePercent: '0',
          previousPeriodProduction: 0,
          previousPeriodPatients: 0,
          productionChange: 0,
          patientsChange: 0,
          comparisonPeriod: 'No comparison data available',
          comparisonPeriod: 'No comparison data available',
          monthlyData: []
        };
        setMetrics(defaultMetrics);
        return defaultMetrics;
      }
    } catch (err) {
      console.error('Error fetching PMS metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PMS metrics');
      
      // Return default metrics on error
      const defaultMetrics: PMSMetrics = {
        totalPatients: 0,
        selfReferred: 0,
        drReferred: 0,
        totalProduction: 0,
        averageProductionPerPatient: 0,
        trend: 'stable',
        changePercent: '0',
        previousPeriodProduction: 0,
        previousPeriodPatients: 0,
        productionChange: 0,
        patientsChange: 0,
        monthlyData: []
      };
      setMetrics(defaultMetrics);
      return defaultMetrics;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRawPMSData = async (startDate: string, endDate: string) => {
    try {
      const url = `${SUPABASE_URL}/functions/v1/pms-raw-data?clientId=${encodeURIComponent(effectiveClientId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      
      const response = await authFetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw PMS data fetched:', data.data);
        console.log('Sample record:', data.data?.[0]);
        return data.data || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching raw PMS data:', err);
      return [];
    }
  };
  const uploadPMSData = async (csvData: any[]) => {
    try {
      setIsLoading(true);
      setError(null);


      const response = await fetch(`${SUPABASE_URL}/functions/v1/pms-upload`, {
        method: 'POST',
        body: JSON.stringify({
          clientId: effectiveClientId,
          csvData
        })
      });


      const result = await response.json();


      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Refresh metrics after successful upload
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = currentDate.toISOString().split('T')[0];
      
      await fetchPMSMetrics(startDate, endDate);

      return result;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const formatMetricsForDisplay = (metrics: PMSMetrics) => {
    if (!metrics) {
      return {
        title: "Practice Management",
        value: "0",
        trend: "stable" as const,
        trendValue: "0%",
        comparison: "No data available",
        metrics: []
      };
    }

    // Format comparison text
    const getComparisonText = () => {
      if (metrics.previousPeriodProduction === 0 && metrics.totalProduction > 0) {
        return `First month with data (${metrics.comparisonPeriod})`;
      }
      
      const productionDiff = metrics.totalProduction - metrics.previousPeriodProduction;
      const patientsDiff = metrics.totalPatients - metrics.previousPeriodPatients;
      
      if (productionDiff > 0 && patientsDiff > 0) {
        return `+$${(productionDiff/1000).toFixed(0)}K production, +${patientsDiff} patients (${metrics.comparisonPeriod})`;
      } else if (productionDiff < 0 || patientsDiff < 0) {
        return `${productionDiff < 0 ? '-' : '+'}$${Math.abs(productionDiff/1000).toFixed(0)}K production, ${patientsDiff < 0 ? '-' : '+'}${Math.abs(patientsDiff)} patients (${metrics.comparisonPeriod})`;
      } else {
        return `Similar performance (${metrics.comparisonPeriod})`;
      }
    };
    return {
      title: "Practice Management",
      value: metrics.totalPatients.toLocaleString(),
      trend: metrics.trend,
      trendValue: `${metrics.trend === 'up' ? '+' : metrics.trend === 'down' ? '-' : ''}${metrics.changePercent}%`,
      comparison: getComparisonText(),
      metrics: [
        { 
          label: "Self-Referred", 
          value: metrics.selfReferred.toLocaleString(), 
          trend: metrics.trend,
          change: metrics.patientsChange
        },
        { 
          label: "Dr-Referred", 
          value: metrics.drReferred.toLocaleString(), 
          trend: metrics.trend,
          change: metrics.patientsChange
        },
        { 
          label: "Total Production", 
          value: `$${(metrics.totalProduction / 1000).toFixed(0)}K`, 
          trend: metrics.trend,
          change: metrics.productionChange,
          previousValue: `$${(metrics.previousPeriodProduction / 1000).toFixed(0)}K previous month`
        },
        { 
          label: "Avg Production/Patient", 
          value: `$${metrics.averageProductionPerPatient.toLocaleString()}`, 
          trend: 'stable',
          change: 0
        }
      ]
    };
  };

  // Auto-fetch PMS data when clientId is available
  useEffect(() => {
    if (effectiveClientId && ready && session) {
      // Load data for current year to get all monthly data
      const fullMonthComparison = getFullMonthComparison();
      console.log('PMS: Auto-fetching data on mount for client:', effectiveClientId);
      console.log('PMS: Using full month comparison:', fullMonthComparison);
      
      // Fetch full year data to populate monthly chart
      const currentDate = new Date();
      const yearStart = new Date(currentDate.getFullYear(), 0, 1).toISOString().split('T')[0];
      const yearEnd = currentDate.toISOString().split('T')[0];
      
      console.log('PMS: Fetching full year data for monthly chart:', { yearStart, yearEnd });
      fetchPMSMetrics(yearStart, yearEnd);
    }
  }, [effectiveClientId, ready, session]);

  return {
    metrics,
    isLoading,
    error,
    fetchPMSMetrics,
    fetchRawPMSData,
    uploadPMSData,
    formatMetricsForDisplay
  };
};