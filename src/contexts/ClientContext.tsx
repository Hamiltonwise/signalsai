import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthReady } from '../hooks/useAuthReady';
import { supabase } from '../lib/supabaseClient';
import { signOutEverywhere } from '../lib/auth';

interface Client {
  id: string;
  practice_name: string;
  account_status: string;
}

interface ClientContextType {
  clientId: string | null;
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  switchClient: (clientId: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { ready, session } = useAuthReady();
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const resolveClient = async () => {
    if (!ready || !session) {
      console.log('ClientContext: Waiting for auth ready state');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsOffline(false);

      console.log('ClientContext: Resolving client for user:', session.user.id);

      // Call the RPC function to ensure user has a client_id
      const { data: resolvedClientId, error: rpcError } = await supabase
        .rpc('ensure_user_context');

      if (rpcError) {
        console.error('ClientContext: RPC error:', rpcError);
        
        // Check if this is a network/connection error
        if (rpcError.message?.includes('Failed to fetch') || rpcError.message?.includes('TypeError: Failed to fetch')) {
          console.log('ClientContext: Network error detected, entering offline mode');
          setIsOffline(true);
          
          // Try to use stored client ID as fallback
          const storedClientId = localStorage.getItem('resolved_client_id');
          if (storedClientId) {
            console.log('ClientContext: Using stored client_id in offline mode:', storedClientId);
            setClientId(storedClientId);
            setClients([{
              id: storedClientId,
              practice_name: 'Demo Practice (Offline)',
              account_status: 'active'
            }]);
            return;
          } else {
            // Create a demo client for offline mode
            const demoClientId = 'demo-client-offline';
            setClientId(demoClientId);
            setClients([{
              id: demoClientId,
              practice_name: 'Demo Practice (Offline)',
              account_status: 'active'
            }]);
            localStorage.setItem('resolved_client_id', demoClientId);
            return;
          }
        }
        
        throw new Error(`Failed to resolve client: ${rpcError.message}`);
      }

      if (!resolvedClientId) {
        throw new Error('No client ID returned from ensure_user_context');
      }

      console.log('ClientContext: Client resolved via RPC:', resolvedClientId);
      setClientId(resolvedClientId);

      // Fetch the client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, practice_name, account_status')
        .eq('id', resolvedClientId)
        .single();

      if (clientError) {
        console.error('ClientContext: Error fetching client details:', clientError);
        // Don't fail completely, just use the ID
        setClients([]);
      } else {
        setClients([clientData]);
      }

      // Store in localStorage for persistence
      localStorage.setItem('resolved_client_id', resolvedClientId);

    } catch (err) {
      console.error('ClientContext: Error resolving client:', err);
      
      // Check for duplicate email constraint error
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve client';
      if (errorMessage.includes('duplicate key value violates unique constraint "clients_email_key"')) {
        console.log('ClientContext: Duplicate email constraint detected, signing out user');
        try {
          await signOutEverywhere();
          window.location.href = '/signin';
          return;
        } catch (signOutError) {
          console.error('ClientContext: Error during signout:', signOutError);
        }
      }
      
      // Check if this is a network error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('TypeError: Failed to fetch')) {
        console.log('ClientContext: Network error in catch block, entering offline mode');
        setIsOffline(true);
        
        // Try to use stored client ID as fallback
        const storedClientId = localStorage.getItem('resolved_client_id');
        if (storedClientId) {
          console.log('ClientContext: Using stored client_id as fallback:', storedClientId);
          setClientId(storedClientId);
          setClients([{
            id: storedClientId,
            practice_name: 'Demo Practice (Offline)',
            account_status: 'active'
          }]);
        } else {
          // Create a demo client for offline mode
          const demoClientId = 'demo-client-offline';
          setClientId(demoClientId);
          setClients([{
            id: demoClientId,
            practice_name: 'Demo Practice (Offline)',
            account_status: 'active'
          }]);
          localStorage.setItem('resolved_client_id', demoClientId);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchClient = async (newClientId: string) => {
    if (!ready || !session) return;

    // If offline, just update local state
    if (isOffline) {
      setClientId(newClientId);
      localStorage.setItem('resolved_client_id', newClientId);
      return;
    }

    try {
      setIsLoading(true);
      
      // Update user's default client preference
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: session.user.id,
          default_client_id: newClientId,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update client preference: ${error.message}`);
      }

      setClientId(newClientId);
      localStorage.setItem('resolved_client_id', newClientId);
      
      console.log('ClientContext: Switched to client:', newClientId);
    } catch (err) {
      console.error('ClientContext: Error switching client:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch client');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClients = async () => {
    if (isOffline) {
      console.log('ClientContext: Cannot refresh clients in offline mode');
      return;
    }
    await resolveClient();
  };

  // Resolve client when auth is ready
  useEffect(() => {
    if (ready && session) {
      resolveClient();
    } else if (ready && !session) {
      // Clear client data when not authenticated
      setClientId(null);
      setClients([]);
      setIsOffline(false);
      localStorage.removeItem('resolved_client_id');
    }
  }, [ready, session]);

  const value: ClientContextType = {
    clientId,
    clients,
    isLoading,
    error,
    isOffline,
    switchClient,
    refreshClients
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}