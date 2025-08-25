import { useState, useEffect } from 'react';
import { useAuthReady } from './useAuthReady';
import { useClient } from '../contexts/ClientContext';

interface ServiceRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  request_type: 'website_change' | 'promotion' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  monday_item_id: string;
  monday_board_id: string;
  created_by_email: string;
  created_by_name: string;
  date_completed?: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

interface UseServiceRequestsReturn {
  serviceRequests: ServiceRequest[];
  isLoading: boolean;
  error: string | null;
  fetchServiceRequests: () => Promise<void>;
  syncServiceRequests: () => Promise<void>;
  createServiceRequest: (requestData: {
    title: string;
    description: string;
    type: 'website_change' | 'promotion' | 'other';
  }) => Promise<ServiceRequest>;
}

export const useServiceRequests = (clientId: string): UseServiceRequestsReturn => {
  const { ready, session } = useAuthReady();
  const { clientId: contextClientId } = useClient();
  const effectiveClientId = clientId || contextClientId;
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState<ServiceRequest[]>([]);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Load persisted requests from localStorage on mount
  useEffect(() => {
    if (effectiveClientId) {
      const storedRequests = localStorage.getItem(`service_requests_${effectiveClientId}`);
      if (storedRequests) {
        try {
          const parsedRequests = JSON.parse(storedRequests);
          setLocalRequests(parsedRequests);
          setServiceRequests(parsedRequests);
          console.log('Loaded persisted service requests:', parsedRequests.length);
        } catch (err) {
          console.error('Error parsing stored service requests:', err);
        }
      }
    }
  }, [effectiveClientId]);

  // Persist requests to localStorage whenever they change
  useEffect(() => {
    if (effectiveClientId && serviceRequests.length > 0) {
      localStorage.setItem(`service_requests_${effectiveClientId}`, JSON.stringify(serviceRequests));
      console.log('Persisted service requests to localStorage:', serviceRequests.length);
    }
  }, [effectiveClientId, serviceRequests]);

  const fetchServiceRequests = async () => {
    if (!ready || !session || !effectiveClientId) return;

    try {
      setError(null);

      console.log('=== Fetching Service Requests ===');
      console.log('Client ID:', effectiveClientId);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-service-requests?clientId=${encodeURIComponent(effectiveClientId)}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Service requests API failed: ${response.status}: ${errorText}`);
        // Don't throw error, just use local requests
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Merge database requests with local requests
        const dbRequests = data.data;
        const mergedRequests = [...localRequests];
        
        // Add database requests that aren't already in local state
        dbRequests.forEach(dbRequest => {
          if (!mergedRequests.find(local => local.id === dbRequest.id)) {
            mergedRequests.push(dbRequest);
          }
        });
        
        setServiceRequests(mergedRequests);
        console.log('Service requests loaded:', data.data.length);
      } else {
        console.warn('No service requests data returned from API');
      }

    } catch (err) {
      console.error('Error fetching service requests:', err);
      // Don't set error, just use local requests
    }
  };

  const syncServiceRequests = async () => {
    if (!ready || !session || !effectiveClientId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('=== Syncing Service Requests with Monday.com ===');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-service-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: effectiveClientId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Sync completed:', data.data);
        // Refresh the list after sync
        await fetchServiceRequests();
      } else {
        throw new Error(data.error || 'Sync failed');
      }

    } catch (err) {
      console.error('Error syncing service requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync service requests');
    } finally {
      setIsLoading(false);
    }
  };

  const createServiceRequest = async (requestData: {
    title: string;
    description: string;
    type: 'website_change' | 'promotion' | 'other';
  }): Promise<ServiceRequest> => {
    if (!ready || !session || !effectiveClientId) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      // Get user data for the request
      const { data: { user } } = await session.user ? { data: { user: session.user } } : await import('../lib/supabaseClient').then(m => m.supabase.auth.getUser());
      const { AuthService } = await import('../utils/authService');
      const userData = AuthService.getUserData();
      
      const userEmail = user?.email || userData?.email || 'unknown@example.com';
      const userName = userData?.first_name && userData?.last_name 
        ? `${userData.first_name} ${userData.last_name}`
        : user?.email || 'Unknown User';

      console.log('=== Creating Service Request ===');
      console.log('Request data:', requestData);
      console.log('User info:', { userEmail, userName });

      // Create the service request object immediately for local state
      const newRequest: ServiceRequest = {
        id: `local-${Date.now()}`, // Temporary local ID
        client_id: effectiveClientId,
        title: requestData.title,
        description: requestData.description,
        request_type: requestData.type,
        status: 'pending',
        monday_item_id: '',
        monday_board_id: '',
        created_by_email: userEmail,
        created_by_name: userName,
        last_synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to local state immediately
      setLocalRequests(prev => [newRequest, ...prev]);
      setServiceRequests(prev => [newRequest, ...prev]);
      
      console.log('Added request to local state:', newRequest);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-service-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: requestData.title,
          description: requestData.description,
          type: requestData.type,
          clientId: effectiveClientId,
          userEmail: userEmail,
          userName: userName
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.warn('Service request API failed, but keeping local copy:', result.error);
        // Keep the local request even if API fails - it's already in state
        console.log('Service request kept in local state despite API failure');
        return newRequest;
      }

      // Update the local request with Monday.com details
      const updatedRequest = {
        ...newRequest,
        id: result.data?.mondayItemId || newRequest.id,
        monday_item_id: result.data?.mondayItemId || '',
        monday_board_id: result.data?.boardId || ''
      };

      // Update local state with Monday.com details
      setLocalRequests(prev => prev.map(req => req.id === newRequest.id ? updatedRequest : req));
      setServiceRequests(prev => prev.map(req => req.id === newRequest.id ? updatedRequest : req));

      console.log('Service request created successfully:', updatedRequest);
      return updatedRequest;

    } catch (err) {
      console.error('Error creating service request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create service request');
      // Don't remove from local state on error - keep the request visible
      console.log('Error occurred but request remains in local state');
      throw err;
    }
  };

  // Auto-fetch service requests when clientId is available
  useEffect(() => {
    if (effectiveClientId && ready && session) {
      fetchServiceRequests();
    }
  }, [effectiveClientId, ready, session]);

  return {
    serviceRequests,
    isLoading,
    error,
    fetchServiceRequests,
    syncServiceRequests,
    createServiceRequest
  };
};