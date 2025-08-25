import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useAuthReady() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      setReady(true);
      return;
    }

    // Production safety - mark as ready immediately if no Supabase config
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Missing Supabase config, marking auth as ready');
      setReady(true);
      return;
    }

    // Prevent duplicate initialization
    if (initializingRef.current) {
      console.log('useAuthReady: Already initializing, skipping duplicate call');
      return;
    }
    
    initializingRef.current = true;
    mountedRef.current = true;
    let sessionCheckComplete = false;

    // Initial session fetch
    (async () => {
      try {
        console.log('useAuthReady: Starting session check...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        
        console.log('useAuthReady: Session check complete', { hasSession: !!session, userId: session?.user?.id });
        setSession(session ?? null);
        setReady(true);
        sessionCheckComplete = true;
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (!mountedRef.current) return;
        // Don't set error for network issues, just mark as ready
        console.warn('Session check failed, marking as ready anyway:', error);
        setSession(null);
        setReady(true);
        sessionCheckComplete = true;
      }
    })();

    // Fallback timeout to ensure ready becomes true (reduced to 500ms for faster loading)
    const fallbackTimeout = setTimeout(() => {
      if (mountedRef.current && !sessionCheckComplete) {
        console.warn('useAuthReady: Session check timed out, marking as ready');
        setReady(true);
      }
    }, 500);

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;
      console.log('useAuthReady: Auth state changed', { event: _event, hasSession: !!nextSession });
      setSession(nextSession ?? null);
      setReady(true);
      sessionCheckComplete = true;
    });

    return () => {
      mountedRef.current = false;
      initializingRef.current = false;
      subscription?.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return { ready, session, error };
}