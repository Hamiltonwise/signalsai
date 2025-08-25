import { useState, useEffect, useRef } from 'react';
import { AuthService } from '../utils/authService';
import { useAuthReady } from './useAuthReady';

interface Integration {
  id: string;
  platform: 'ga4' | 'gbp' | 'gsc' | 'clarity';
  account_name?: string;
  connection_status: 'active' | 'expired' | 'error' | 'disconnected';
  last_sync?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const useIntegrations = (clientId: string) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ready, session } = useAuthReady();
  
  // Store promise callbacks for OAuth flows
  const gscAuthCallbacks = useRef<{ resolve?: (value: any) => void; reject?: (reason: any) => void }>({});
  const gbpAuthCallbacks = useRef<{ resolve?: (value: any) => void; reject?: (reason: any) => void }>({});

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authToken = AuthService.getToken();
      if (!authToken) {
        console.error('Authentication check passed but no token found - this indicates an AuthService issue');
        setError('Authentication error. Please sign in again.');
        return;
      }

      // Call the Express backend route for integrations
      const response = await fetch('/api/integrations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific auth errors (e.g., 401 Unauthorized, 403 Forbidden)
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed for integrations:', errorData.error);
          setError('Session expired or unauthorized. Please log in again.');
          // Optionally, redirect to login page
          // window.location.href = '/signin';
        } else {
          throw new Error(errorData.error || 'Failed to fetch integrations');
        }
      } else {
        const data = await response.json();
        setIntegrations(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const connectGBP = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/gbp-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          throw new Error('⚠️ Supabase Edge Functions not deployed!\n\nTo fix this:\n1. Click "Connect to Supabase" in the top right corner of Bolt\n2. This will automatically deploy all required functions\n3. Then try connecting GBP again');
        }
        throw new Error(`Failed to initiate GBP connection: ${errorText}`);
      }

      const data = await response.json();
      
      // Open popup for OAuth
      const popup = window.open(data.authUrl, 'gbp-auth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        // Store callbacks for global message listener
        gbpAuthCallbacks.current = { resolve, reject };
        
        // Timeout after 5 minutes
        setTimeout(() => {
          popup?.close();
          gbpAuthCallbacks.current = {};
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect GBP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectGSC = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/gsc-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate GSC connection');
      }

      const data = await response.json();
      
      // Open popup for OAuth
      const popup = window.open(data.authUrl, 'gsc-auth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        // Store callbacks for global message listener
        gscAuthCallbacks.current = { resolve, reject };
        
        // Timeout after 5 minutes
        setTimeout(() => {
          popup?.close();
          gscAuthCallbacks.current = {};
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect GSC');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectClarity = async (apiToken: string, projectId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('=== Clarity Connect Debug ===');
      console.log('Client ID:', clientId);
      console.log('API Token length:', apiToken?.length || 0);
      console.log('Project ID:', projectId);
      console.log('Supabase URL:', SUPABASE_URL);
      console.log('Has Anon Key:', !!SUPABASE_ANON_KEY);

      if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }
      
      if (!SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/clarity-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, apiToken, projectId })
      });

      console.log('Clarity connect response status:', response.status);
      console.log('Clarity connect response headers:', Object.fromEntries(response.headers.entries()));

      // Read response text first to check if it's HTML
      const responseText = await response.text();
      console.log('Response text preview:', responseText.substring(0, 200));

      // Check if response is HTML (indicates wrong endpoint)
      if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML response instead of JSON');
        throw new Error(`Environment variable error: VITE_SUPABASE_URL is incorrectly configured. Current value: "${SUPABASE_URL}". Please set it to your Supabase project URL (https://your-project-ref.supabase.co)`);
      }

      if (!response.ok) {
        console.error('Clarity connect failed:', response.status, responseText);
        if (response.status === 404) {
          throw new Error('Clarity connect function not found. Please ensure Supabase Edge Functions are deployed.');
        }
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      console.log('Clarity connect success:', data);
      fetchIntegrations(); // Refresh integrations list
      return data;
    } catch (err) {
      console.error('Clarity connect error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Clarity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll handle disconnection by clearing localStorage
      // In a full implementation, you'd call a Supabase Edge Function to remove credentials
      
      // Find the integration to get its platform
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Clear localStorage for this platform
      const platform = integration.platform;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`${platform}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Remove from integrations list
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));

      // TODO: Implement actual API call to remove credentials from database
      /*
      const response = await fetch(`${SUPABASE_URL}/functions/v1/disconnect-integration`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ integrationId, platform })
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }
      */

      console.log(`Successfully disconnected ${platform} integration`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect integration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = (platform: string) => {
    return integrations.some(
      integration => integration.platform === platform && integration.connection_status === 'active'
    );
  };

  const getIntegration = (platform: string) => {
    return integrations.find(integration => integration.platform === platform);
  };

  useEffect(() => {
    // Fetch integrations when we have a client ID and auth is ready
    if (clientId && ready && session) {
      fetchIntegrations();
    } else {
      console.log('Waiting for auth ready state for integrations fetch.', { clientId, ready, hasSession: !!session });
    }
    
    // Handle OAuth callback in popup window
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isPopup = urlParams.get('popup') === 'true';
      
      if (isPopup && window.opener) {
        // Handle GSC callback
        const gscAuth = urlParams.get('gsc_auth');
        const sitesParam = urlParams.get('sites');
        
        if (gscAuth === 'success' && sitesParam) {
          try {
            const sites = JSON.parse(decodeURIComponent(sitesParam));
            window.opener.postMessage({
              type: 'GSC_AUTH_SUCCESS',
              sites: sites
            }, '*');
          } catch (err) {
            window.opener.postMessage({
              type: 'GSC_AUTH_ERROR',
              error: 'Failed to parse sites data'
            }, '*');
          }
          window.close();
          return;
        } else if (gscAuth === 'error') {
          const errorMessage = urlParams.get('message') || 'Unknown error';
          window.opener.postMessage({
            type: 'GSC_AUTH_ERROR',
            error: errorMessage
          }, '*');
          window.close();
          return;
        }
        
        // Handle GBP callback
        const gbpAuth = urlParams.get('gbp_auth');
        const locationsParam = urlParams.get('locations');
        
        if (gbpAuth === 'success' && locationsParam) {
          try {
            const locations = JSON.parse(decodeURIComponent(locationsParam));
            window.opener.postMessage({
              type: 'GBP_AUTH_SUCCESS',
              locations: locations
            }, '*');
          } catch (err) {
            window.opener.postMessage({
              type: 'GBP_AUTH_ERROR',
              error: 'Failed to parse locations data'
            }, '*');
          }
          window.close();
          return;
        } else if (gbpAuth === 'error') {
          const errorMessage = urlParams.get('message') || 'Unknown error';
          window.opener.postMessage({
            type: 'GBP_AUTH_ERROR',
            error: errorMessage
          }, '*');
          window.close();
          return;
        }
      }
    };
    
    handleOAuthCallback();

    // Global message listener for OAuth callbacks and refresh requests
    const messageListener = (event: MessageEvent) => {
      // Only process messages from our own popups
      if (!event.data || typeof event.data !== 'object') return;
      
      if (event.data.type === 'GBP_AUTH_SUCCESS') {
        if (gbpAuthCallbacks.current.resolve) {
          gbpAuthCallbacks.current.resolve(event.data);
          gbpAuthCallbacks.current = {};
          fetchIntegrations();
        }
      } else if (event.data.type === 'GBP_AUTH_ERROR') {
        if (gbpAuthCallbacks.current.reject) {
          gbpAuthCallbacks.current.reject(new Error(event.data.error));
          gbpAuthCallbacks.current = {};
        }
      } else if (event.data.type === 'GSC_AUTH_SUCCESS') {
        if (gscAuthCallbacks.current.resolve) {
          gscAuthCallbacks.current.resolve(event.data);
          gscAuthCallbacks.current = {};
          fetchIntegrations();
        }
      } else if (event.data.type === 'GSC_AUTH_ERROR') {
        if (gscAuthCallbacks.current.reject) {
          gscAuthCallbacks.current.reject(new Error(event.data.error));
          gscAuthCallbacks.current = {};
        }
      }
    };
    window.addEventListener('message', messageListener);

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, [ready, session, clientId]);

  return {
    integrations,
    isLoading,
    error,
    fetchIntegrations,
    connectGBP,
    connectGSC,
    connectClarity,
    disconnectIntegration,
    isConnected,
    getIntegration
  };
};