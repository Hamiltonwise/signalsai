import { useState, useEffect } from 'react';
import { AuthService } from '../utils/authService';
import { supabase } from '../lib/supabaseClient';

interface SessionState {
  isReady: boolean;
  isAuthenticated: boolean;
  clientId: string | null;
  userId: string | null;
  error: string | null;
}

export const useSessionReady = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isReady: true, // Start as ready to prevent blocking
    isAuthenticated: false,
    clientId: null,
    userId: null,
    error: null
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          setSessionState({
            isReady: true,
            isAuthenticated: false,
            clientId: null,
            userId: null,
            error: 'Not in browser environment'
          });
          return;
        }

        // Check Supabase session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Session check error:', sessionError);
        }
        
        // Use Supabase session if available, otherwise fall back to AuthService
        const hasAuth = session?.access_token || AuthService.isAuthenticated();

        const clientId = AuthService.getClientId();
        const userId = session?.user?.id || AuthService.getUserId();
        const token = session?.access_token || AuthService.getToken();

        if (!hasAuth || !clientId || !token) {
          setSessionState({
            isReady: true,
            isAuthenticated: false,
            clientId: null,
            userId: null,
            error: null
          });
          return;
        }

        // Session is ready and valid
        setSessionState({
          isReady: true,
          isAuthenticated: true,
          clientId,
          userId: userId || clientId, // Fallback to clientId if userId missing
          error: null
        });

      } catch (error) {
        console.error('Session check failed:', error);
        setSessionState({
          isReady: true,
          isAuthenticated: AuthService.isAuthenticated(), // Fallback to basic auth check
          clientId: null,
          userId: null,
          error: null // Don't block on errors
        });
      }
    };

    checkSession();
  }, []);

  return sessionState;
};