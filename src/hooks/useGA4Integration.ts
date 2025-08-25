import { useState, useEffect } from 'react';
import { getMTDComparison, calculateMTDChange, getLast30DaysComparison, type MTDComparison } from '../utils/dateUtils';
import { useClient } from '../contexts/ClientContext';
import { supabase } from '../lib/supabaseClient';

interface GA4Metrics {
  totalUsers: number;
  newUsers: number;
  engagementRate: number;
  conversions: number;
  avgSessionDuration: number;
  calculatedScore: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: string;
}

interface GA4Property {
  id: string;
  displayName: string;
  accountName: string;
}

export const useGA4Integration = (clientId: string, ready: boolean, session: any) => {
  // Use ClientContext for consistent client ID
  const { clientId: contextClientId } = useClient();
  const effectiveClientId = clientId || contextClientId;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<GA4Metrics | null>(null);
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentDateRange, setCurrentDateRange] = useState<MTDComparison | null>(null);

  // Expose hook methods globally for modal communication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.ga4IntegrationHook = {
        handlePropertiesReceived: (receivedProperties: any[]) => {
          console.log('🔗 GA4 Hook: Received properties via global method:', receivedProperties.length);
          
          const enhancedProperties = receivedProperties.map(prop => {
            const displayNameLower = prop.displayName.toLowerCase();
            let domainHint = 'unknown';
            
            if (displayNameLower.includes('hamilton') || displayNameLower.includes('hamiltonwise')) {
              domainHint = 'hamilton-wise';
            } else if (displayNameLower.includes('tricity') || displayNameLower.includes('endodontics')) {
              domainHint = 'tricity-endodontics';
            } else if (displayNameLower.includes('dental') || displayNameLower.includes('orthodontics')) {
              domainHint = 'dental-practice';
            }
            
            return { ...prop, domainHint };
          });
          
          setProperties(enhancedProperties);
          setIsConnected(true);
          setError(null);
          setIsLoading(false);
          
          // Store connection state
          if (effectiveClientId) {
            localStorage.setItem(`ga4_connected_${effectiveClientId}`, 'true');
            localStorage.setItem(`ga4_properties_${effectiveClientId}`, JSON.stringify(enhancedProperties));
          }
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.ga4IntegrationHook;
      }
    };
  }, [effectiveClientId]);

  // Enhanced client ID validation and debugging
  useEffect(() => {
    console.log('🔍 GA4 Integration Debug:', {
      clientId: effectiveClientId,
      hasClientId: !!effectiveClientId,
      clientIdLength: effectiveClientId?.length || 0,
      ready,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      timestamp: new Date().toISOString()
    });
  }, [effectiveClientId, ready, session]);

  // Enhanced property selection with persistence and validation
  const setSelectedPropertyWithPersistence = (propertyId: string) => {
    setSelectedProperty(propertyId);
    
    // Persist to localStorage with client-specific key
    if (clientId && propertyId) {
      localStorage.setItem(`ga4_selected_property_${clientId}`, propertyId);
    }
    
    // Clear any existing metrics when property changes
    setMetrics(null);
    setError(null);
  };

  // Load persisted property selection on mount
  useEffect(() => {
    if (effectiveClientId && isConnected && properties.length > 0) {
      const storedProperty = localStorage.getItem(`ga4_selected_property_${effectiveClientId}`);
      
      if (storedProperty && properties.find(p => p.id === storedProperty)) {
        setSelectedProperty(storedProperty);
      } else {
        // Auto-select practice-related properties
        const practiceProperty = properties.find(p => 
          p.domainHint === 'practice-site' || 
          p.displayName.toLowerCase().includes('hamiltonwise') ||
          p.displayName.toLowerCase().includes('tricity') ||
          p.displayName.toLowerCase().includes('endodontics')
        );
        
        if (practiceProperty) {
          console.log('Auto-selecting practice property:', practiceProperty.displayName);
          setSelectedPropertyWithPersistence(practiceProperty.id);
        } else if (properties.length === 1) {
          // Auto-select if only one property available
          setSelectedPropertyWithPersistence(properties[0].id);
        }
      }
    }
  }, [effectiveClientId, isConnected, properties]);

  // Listen for popup messages from the ga4-callback function
  useEffect(() => {
    // Only set up listener if we have a valid clientId and are ready
    if (!effectiveClientId || !ready) {
      return;
    }
    
    const messageListener = (event: MessageEvent) => {
      // Only process messages from our own popups
      if (!event.data || typeof event.data !== 'object') return;
      
      console.log('🔗 GA4 Integration Hook: Received message', { 
        type: event.data.type,
        hasProperties: !!event.data.properties,
        propertiesCount: event.data.properties?.length || 0,
        clientId: event.data.clientId
      });
      
      if (event.data.type === 'GA4_AUTH_SUCCESS') {
        console.log('🔗 GA4 Integration Hook: Processing AUTH_SUCCESS', {
          propertiesCount: event.data.properties?.length || 0
        });
        
        const receivedProperties = event.data.properties || [];
        
        // Enhanced property processing with better domain hints
        const enhancedProperties = receivedProperties.map(prop => {
          const displayNameLower = prop.displayName.toLowerCase();
          let domainHint = 'unknown';
          
          if (displayNameLower.includes('hamilton') || displayNameLower.includes('hamiltonwise')) {
            domainHint = 'hamilton-wise';
          } else if (displayNameLower.includes('tricity') || displayNameLower.includes('endodontics')) {
            domainHint = 'tricity-endodontics';
          } else if (displayNameLower.includes('dental') || displayNameLower.includes('orthodontics')) {
            domainHint = 'dental-practice';
          }
          
          return {
            ...prop,
            domainHint
          };
        });
        
        console.log('🔗 GA4 Integration Hook: Enhanced properties:', enhancedProperties);
        
        setProperties(enhancedProperties);
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        
        // Store connection state
        if (effectiveClientId) {
          localStorage.setItem(`ga4_connected_${effectiveClientId}`, 'true');
          localStorage.setItem(`ga4_properties_${effectiveClientId}`, JSON.stringify(enhancedProperties));
          console.log('🔗 GA4 Integration Hook: Stored connection state for client', effectiveClientId);
        }
        
        // Auto-select practice-related properties
        const practiceProperty = enhancedProperties.find(p => 
          p.domainHint === 'hamilton-wise' || 
          p.domainHint === 'tricity-endodontics'
        );
        
        if (practiceProperty && effectiveClientId) {
          console.log('🔗 GA4 Integration Hook: Auto-selecting practice property:', practiceProperty.displayName);
          setSelectedPropertyWithPersistence(practiceProperty.id);
        } else if (enhancedProperties.length === 1 && effectiveClientId) {
          setSelectedPropertyWithPersistence(enhancedProperties[0].id);
        }
      } else if (event.data.type === 'GA4_AUTH_ERROR') {
        console.log('🔗 GA4 Integration Hook: Processing AUTH_ERROR', event.data.error);
        setError(`GA4 connection failed: ${event.data.error}`);
        setIsLoading(false);
      }
    };

    // Also listen for custom events from the modal
    const customEventListener = (event: CustomEvent) => {
      if (event.type === 'ga4-properties-received') {
        console.log('🔗 GA4 Integration Hook: Received properties via custom event', event.detail.properties);
        const receivedProperties = event.detail.properties || [];
        
        // Process properties same as message listener
        const enhancedProperties = receivedProperties.map(prop => {
          const displayNameLower = prop.displayName.toLowerCase();
          let domainHint = 'unknown';
          
          if (displayNameLower.includes('hamilton') || displayNameLower.includes('hamiltonwise')) {
            domainHint = 'hamilton-wise';
          } else if (displayNameLower.includes('tricity') || displayNameLower.includes('endodontics')) {
            domainHint = 'tricity-endodontics';
          } else if (displayNameLower.includes('dental') || displayNameLower.includes('orthodontics')) {
            domainHint = 'dental-practice';
          }
          
          return {
            ...prop,
            domainHint
          };
        });
        
        setProperties(enhancedProperties);
        setIsConnected(true);
        setError(null);
        
        // Store connection state
        if (effectiveClientId) {
          localStorage.setItem(`ga4_connected_${effectiveClientId}`, 'true');
          localStorage.setItem(`ga4_properties_${effectiveClientId}`, JSON.stringify(enhancedProperties));
        }
      }
    };
    window.addEventListener('message', messageListener);
    window.addEventListener('ga4-properties-received', customEventListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
      window.removeEventListener('ga4-properties-received', customEventListener);
    };
  }, [effectiveClientId, ready]);

  // Listen for custom events from the modal's message handler
  useEffect(() => {
    if (!effectiveClientId || !ready) return;
    
    const handlePropertiesReceived = (event: CustomEvent) => {
      console.log('🔗 GA4 Hook: Received properties via custom event', {
        propertiesCount: event.detail.properties?.length || 0,
        clientId: event.detail.clientId,
        success: event.detail.success
      });
      
      if (event.detail.properties && Array.isArray(event.detail.properties)) {
        const enhancedProperties = event.detail.properties.map(prop => {
          const displayNameLower = prop.displayName.toLowerCase();
          let domainHint = 'unknown';
          
          if (displayNameLower.includes('hamilton') || displayNameLower.includes('hamiltonwise')) {
            domainHint = 'hamilton-wise';
          } else if (displayNameLower.includes('tricity') || displayNameLower.includes('endodontics')) {
            domainHint = 'tricity-endodontics';
          } else if (displayNameLower.includes('dental') || displayNameLower.includes('orthodontics')) {
            domainHint = 'dental-practice';
          }
          
          return { ...prop, domainHint };
        });
        
        console.log('🔗 GA4 Hook: Setting enhanced properties:', enhancedProperties.length);
        setProperties(enhancedProperties);
        setIsConnected(true);
        setError(null);
        setIsLoading(false);
        
        // Store connection state
        if (effectiveClientId) {
          localStorage.setItem(`ga4_connected_${effectiveClientId}`, 'true');
          localStorage.setItem(`ga4_properties_${effectiveClientId}`, JSON.stringify(enhancedProperties));
          console.log('🔗 GA4 Hook: Stored connection state for client', effectiveClientId);
        }
        
        // Auto-select Hamilton Wise if available
        const hamiltonWise = enhancedProperties.find(p => p.domainHint === 'hamilton-wise');
        if (hamiltonWise) {
          console.log('🔗 GA4 Hook: Auto-selecting Hamilton Wise property');
          setSelectedPropertyWithPersistence(hamiltonWise.id);
        }
      }
    };

    window.addEventListener('ga4-properties-received', handlePropertiesReceived);
    
    return () => {
      window.removeEventListener('ga4-properties-received', handlePropertiesReceived);
    };
  }, [effectiveClientId, ready]);
  // Check if GA4 is connected by looking for URL params or stored state
  useEffect(() => {
    console.log('GA4 Integration: Checking connection state...', { effectiveClientId });
    
    const urlParams = new URLSearchParams(window.location.search);
    const ga4Auth = urlParams.get('ga4_auth');
    const propertiesParam = urlParams.get('properties');
    const isPopup = urlParams.get('popup') === 'true';
    
    console.log('GA4 Integration: URL params check', { ga4Auth, hasProperties: !!propertiesParam, isPopup });
    
    if (ga4Auth === 'success' && propertiesParam) {
      try {
        const parsedProperties = JSON.parse(decodeURIComponent(propertiesParam));
        
        // Enhanced property processing with domain hints
        const enhancedProperties = parsedProperties.map(prop => ({
          ...prop,
          domainHint: prop.displayName.toLowerCase().includes('hamilton wise') || 
                     prop.displayName.toLowerCase().includes('tricity endodontics') ? 'practice-site' : 'unknown'
        }));
        
        console.log('GA4 Integration: Setting properties from URL params', enhancedProperties.length);
        setProperties(parsedProperties);
        setIsConnected(true);
        setError(null);
        
        // Store connection state
        if (effectiveClientId) {
          localStorage.setItem(`ga4_connected_${effectiveClientId}`, 'true');
          localStorage.setItem(`ga4_properties_${effectiveClientId}`, JSON.stringify(enhancedProperties));
          console.log('GA4 Integration: Stored connection state for client', effectiveClientId);
        }
        
        // If this is a popup redirect, close the popup and notify parent
        if (isPopup && window.opener) {
          console.log('GA4 Integration: Posting message to parent and closing popup');
          window.opener.postMessage({
            type: 'GA4_AUTH_SUCCESS',
            properties: enhancedProperties
          }, '*');
          window.close();
          return;
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error parsing properties:', err);
        setError('Failed to parse GA4 properties');
      }
    } else if (ga4Auth === 'error' && isPopup && window.opener) {
      // Handle error in popup
      const errorMessage = urlParams.get('message') || 'Unknown error';
      window.opener.postMessage({
        type: 'GA4_AUTH_ERROR',
        error: errorMessage
      }, '*');
      window.close();
      return;
    } else {
      // Check if we have stored connection state
      console.log('GA4 Integration: Checking stored connection state...');
      const storedConnection = localStorage.getItem(`ga4_connected_${effectiveClientId}`);
      const storedProperties = localStorage.getItem(`ga4_properties_${effectiveClientId}`);
      
      console.log('GA4 Integration: Stored state check', { 
        hasStoredConnection: storedConnection === 'true', 
        hasStoredProperties: !!storedProperties 
      });
      
      if (storedConnection === 'true' && storedProperties) {
        try {
          const parsedProperties = JSON.parse(storedProperties);
          console.log('GA4 Integration: Restored connection from localStorage', parsedProperties.length);
          setProperties(parsedProperties);
          setIsConnected(true);
        } catch (err) {
          console.error('Error parsing stored properties:', err);
        }
      }
    }
  }, [effectiveClientId]);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Auto-fetch data when connected and property is selected
  useEffect(() => {
    // Gate all fetches behind auth readiness
    if (!ready || !session) {
      console.log('GA4: Waiting for auth ready state', { ready, hasSession: !!session });
      return;
    }
    
    if (isConnected && selectedProperty && effectiveClientId) {
      // Use last 30 days for detailed analytics
      const last30Days = getLast30DaysComparison();
      setCurrentDateRange(last30Days);
      
      console.log('GA4: Auto-fetching data for property:', selectedProperty);
      console.log('GA4: Using last 30 days range:', last30Days.current);
      
      // Fetch data immediately when property is selected
      fetchGA4Data(selectedProperty, last30Days.current.startDate, last30Days.current.endDate)
        .then(() => {
          console.log('GA4: Auto-fetch completed successfully');
        })
        .catch(error => {
          console.error('GA4: Auto-fetch failed:', error);
        });
    }
  }, [ready, session, isConnected, selectedProperty, effectiveClientId]);

  const refreshWithLast30Days = async () => {
    if (selectedProperty) {
      const last30Days = getLast30DaysComparison();
      setCurrentDateRange(last30Days);
      return fetchGA4Data(selectedProperty, last30Days.current.startDate, last30Days.current.endDate);
    }
  };
  const initiateGA4Connection = async () => {
    console.log('GA4 Connection: Starting...');
    
    setIsLoading(true);
    setError(null);

    try {
      // Validate we have auth session
      if (!ready || !session) {
        throw new Error('No active session. Please sign in first.');
      }

      console.log('GA4 Connection: Getting current session...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('No active session. Please sign in first.');
      }

      console.log('GA4 Connection: Session verified, calling auth function...');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ga4-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('GA4 Connection: Auth function response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GA4 Connection: Auth function error:', errorData);
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const data = await response.json();
      console.log('GA4 Connection: Auth function response:', data);
      
      if (!data.success || !data.authUrl) {
        throw new Error('No auth URL received');
      }

      console.log('GA4 Connection: Opening popup with auth URL...');
      // Open popup and navigate to auth URL
      const popup = window.open('', 'ga4_connect', 'width=520,height=700,scrollbars=yes,resizable=yes');
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      popup.location.href = data.authUrl;
      
      console.log('GA4 Connection: Popup opened successfully');
      
      // Store connection state
      if (data.clientId) {
        localStorage.setItem(`ga4_connected_${data.clientId}`, 'true');
      }

    } catch (error) {
      console.error('GA4 connection error:', error);
      let errorMessage = 'Failed to initiate GA4 connection';
      
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

  const fetchGA4Properties = async () => {
    try {
      // Use the existing ga4-auth function to get properties
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ga4-auth?clientId=${effectiveClientId}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.authUrl) {
          // Properties will be set when the callback completes
          console.log('GA4 auth URL generated, properties will be available after OAuth');
        }
      }
    } catch (error) {
      console.error('Error with GA4 auth:', error);
    }
  };

  const fetchStoredGA4Properties = async () => {
    try {
      // Check if we have stored properties from a previous connection
      const storedProperties = localStorage.getItem(`ga4_properties_${effectiveClientId}`);
      if (storedProperties) {
        try {
          const parsedProperties = JSON.parse(storedProperties);
          setProperties(parsedProperties);
        } catch (err) {
          console.error('Error parsing stored GA4 properties:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching stored GA4 properties:', error);
    }
  };

  // Load stored properties on mount if connected
  useEffect(() => {
    if (effectiveClientId && isConnected) {
      fetchStoredGA4Properties();
    }
  }, [effectiveClientId, isConnected]);

  const refreshStoredProperties = async () => {
    try {
      // Check if we have stored properties from a previous connection
      const storedProperties = localStorage.getItem(`ga4_properties_${effectiveClientId}`);
      if (storedProperties) {
        try {
          const parsedProperties = JSON.parse(storedProperties);
          setProperties(parsedProperties);
        } catch (err) {
          console.error('Error parsing stored GA4 properties:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching stored GA4 properties:', error);
    }
  };


  const fetchGA4Data = async (propertyId: string, startDate: string, endDate: string) => {
    try {
      if (!effectiveClientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);

      console.log('=== GA4 Fetch Data Debug ===');
      console.log('Client ID:', effectiveClientId);
      console.log('Property ID:', propertyId);
      console.log('Date range:', { startDate, endDate });
      console.log('Supabase URL:', SUPABASE_URL);
      console.log('Has Anon Key:', !!SUPABASE_ANON_KEY);
      // Enhanced logging for debugging data discrepancies
      const requestData = { clientId: effectiveClientId, propertyId, startDate, endDate };

      // Add retry logic for Google API server errors
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`GA4 fetch attempt ${retryCount + 1}/${maxRetries + 1}`);
          
          response = await fetch(`${SUPABASE_URL}/functions/v1/ga4-fetch-data`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          });
          
          // If we get a 502/503 from Google, retry after delay
          if ((response.status === 502 || response.status === 503) && retryCount < maxRetries) {
            console.log(`GA4 API server error (${response.status}), retrying in ${(retryCount + 1) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            retryCount++;
            continue;
          }
          
          break; // Success or non-retryable error
        } catch (fetchError) {
          if (retryCount < maxRetries) {
            console.log(`Network error, retrying in ${(retryCount + 1) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            retryCount++;
            continue;
          }
          throw fetchError;
        }
      }

      console.log('GA4 fetch response status:', response.status);
      console.log('GA4 fetch response headers:', Object.fromEntries(response.headers.entries()));
      const data = await response.json();
      console.log('GA4 fetch response data:', data);
      
      // Store debug info for troubleshooting
      setDebugInfo({
        request: requestData,
        response: data,
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch GA4 data');
      
      console.log('🎯 GA4: Data fetch completed, now getting processed metrics...');
      // After successful fetch, get the processed metrics using existing ga4-metrics function
      await getGA4Metrics(startDate, endDate);
      return data;
    } catch (err) {
      console.error('Error in fetchGA4Data:', err);
      
      // Enhanced error handling for different types of failures
      let errorMessage = 'Failed to fetch GA4 data';
      if (err instanceof Error) {
        if (err.message.includes('502') || err.message.includes('503')) {
          errorMessage = 'Google Analytics API is temporarily unavailable. Please try again in a few minutes.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getGA4Metrics = async (startDate: string, endDate: string) => {
    try {
      // Gate fetch behind auth readiness
      if (!ready || !session) {
        console.log('GA4: Waiting for auth ready state');
        return;
      }
      
      if (!effectiveClientId) {
        throw new Error('Client ID is required');
      }

      setIsLoading(true);
      setError(null);

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

      console.log('🎯 GA4: Fetching processed metrics from ga4-metrics function');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ga4-metrics?clientId=${effectiveClientId}&startDate=${startDate}&endDate=${endDate}`, {

        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      console.log('🎯 GA4: Metrics response status:', response.status);

      // Read response text only once to avoid "body stream already read" error
      let responseText;
      try {
        responseText = await response.text();
      } catch (e) {
        throw new Error(`Failed to read response: ${e.message}`);
      }

      console.log('🎯 GA4: Metrics response preview:', responseText.substring(0, 200));

      // Check if response is HTML (indicates wrong endpoint)
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        throw new Error(`Environment variable error: VITE_SUPABASE_URL is incorrectly configured. Current value: "${SUPABASE_URL}". Please set it to your Supabase project URL (https://your-project-ref.supabase.co)`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GA4 metrics function not found. Please ensure Supabase Edge Functions are deployed.');
        }
        
        if (response.status === 500) {
          throw new Error(`Server error in GA4 metrics function: ${responseText}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from GA4 metrics function. Response was: ${responseText.substring(0, 100)}... Parse error: ${parseError.message}`);
      }

      console.log('🎯 GA4: Parsed metrics data:', data);
      
      // Validate data sanity
      if (data.data && data.data.totalUsers) {
        console.log('🎯 GA4: Validating data sanity...');
        console.log('🎯 GA4: Raw data records:', data.rawData?.length || 0);
        
        // Flag suspicious data
        if (data.data.totalUsers > 10000) {
          console.warn('⚠️ SUSPICIOUS: Very high user count detected. This might be demo data or wrong property.');
        }
        
        // Validate data consistency between raw and aggregated
        if (data.rawData && data.rawData.length > 0) {
          const rawTotalUsers = data.rawData.reduce((sum, record) => sum + (record.total_users || 0), 0);
          const rawSessions = data.rawData.reduce((sum, record) => sum + (record.sessions || 0), 0);
          
          console.log('🎯 GA4: Data consistency check:', {
            aggregatedUsers: data.data.totalUsers,
            rawUsers: rawTotalUsers,
            aggregatedSessions: data.data.sessions,
            rawSessions: rawSessions
          });
          
          if (Math.abs(data.data.totalUsers - rawTotalUsers) > 1) {
            console.error('🎯 GA4: DATA INCONSISTENCY - Aggregated users do not match raw data sum');
          }
        }
        
        // Check for impossible data combinations
        if (data.data.totalUsers > 0 && data.data.sessions === 0) {
          console.error('⚠️ GA4 DATA INCONSISTENCY: Users > 0 but Sessions = 0. This is impossible in GA4.');
        }
        
        console.log('🎯 GA4: Data validation complete. Users:', data.data.totalUsers, 'Engagement:', data.data.engagementRate);
      }
      
      if (data.success && data.data) {
        console.log('🎯 GA4: Setting real metrics from stored data:', data.data);
        setMetrics(data.data);
        return data.data;
      } else {
        console.warn('🎯 GA4: No metrics data returned, using defaults');
        // If no data found, return default metrics
        const defaultMetrics: GA4Metrics = {
          totalUsers: 0,
          newUsers: 0,
          engagementRate: 0,
          conversions: 0,
          avgSessionDuration: 0,
          calculatedScore: 0,
          trend: 'stable',
          changePercent: '0'
        };
        setMetrics(defaultMetrics);
        return defaultMetrics;
      }
      
    } catch (err) {
      console.error('Error in getGA4Metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to get GA4 metrics');
      
      // Return default metrics on error
      const defaultMetrics: GA4Metrics = {
        totalUsers: 0,
        newUsers: 0,
        engagementRate: 0,
        conversions: 0,
        avgSessionDuration: 0,
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

  const formatMetricsForDisplay = (metrics: GA4Metrics) => {
    if (!metrics || typeof metrics !== 'object') {
      return {
        title: "Website Performance",
        value: "0",
        trend: "stable" as const,
        trendValue: "0%",
        metrics: []
      };
    }

    return {
      title: "Website Performance",
      value: (metrics.totalUsers || 0).toLocaleString(),
      trend: metrics.trend || 'stable',
      trendValue: `${(metrics.trend || 'stable') === 'up' ? '+' : (metrics.trend || 'stable') === 'down' ? '-' : ''}${metrics.changePercent || '0'}%`,
      metrics: [
        { label: "New Users", value: (metrics.newUsers || 0).toLocaleString(), trend: metrics.trend || 'stable' },
        { label: "Engagement Rate", value: `${(metrics.engagementRate || 0).toFixed(1)}%`, trend: metrics.trend || 'stable' },
        { label: "Conversions", value: (metrics.conversions || 0).toString(), trend: metrics.trend || 'stable' },
        { label: "Avg. Session Duration", value: formatDuration(metrics.avgSessionDuration || 0), trend: 'stable' }
      ]
    };
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    isConnected,
    isLoading,
    metrics,
    properties,
    selectedProperty,
    error,
    debugInfo,
    setSelectedProperty: setSelectedPropertyWithPersistence,
    initiateGA4Connection,
    fetchGA4Data,
    getGA4Metrics,
    formatMetricsForDisplay,
    // Add method to manually trigger data fetch
    refreshData: refreshWithLast30Days,
    currentDateRange,
    getLast30DaysComparison: () => getLast30DaysComparison()
  };
};