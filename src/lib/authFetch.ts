import { supabase } from './supabaseClient';

// Ensure absolute URL construction for all Edge Function calls
const getEdgeFunctionUrl = (functionName: string): string => {
  const BASE = import.meta.env.VITE_SUPABASE_URL!.replace(/\/$/, '');
  const cleanFunctionName = functionName.replace(/^\//, '').replace(/^functions\/v1\//, '');
  return `${BASE}/functions/v1/${cleanFunctionName}`;
};

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  // Validate environment variables
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    const error = `Missing required environment variables. VITE_SUPABASE_URL: ${!!import.meta.env.VITE_SUPABASE_URL}, VITE_SUPABASE_ANON_KEY: ${!!import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    console.error('authFetch:', error);
    throw new Error(error);
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    console.error('authFetch: No active session found');
    throw new Error('No active session');
  }

  // Dev sanity check
  if (import.meta.env.DEV) {
    console.debug('JWT present?', !!session?.access_token, session?.access_token?.split('.').length === 3 ? 'looks like JWT' : 'not a JWT');
  }

  // Handle URL construction - if already absolute, use as-is
  let finalUrl: string;
  if (typeof input === 'string') {
    // If already an absolute URL, use it directly
    if (input.startsWith('http://') || input.startsWith('https://')) {
      finalUrl = input;
    } else {
      // For relative URLs, construct the full Edge Function URL
      const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
      const cleanInput = input.replace(/^\//, '');
      finalUrl = `${baseUrl}/functions/v1/${cleanInput}`;
    }
  } else if (input instanceof URL) {
    finalUrl = input.toString();
  } else {
    finalUrl = typeof input === 'object' && 'url' in input ? input.url : String(input);
  }

  // Validate final URL format
  if (!finalUrl.includes('/functions/v1/')) {
    console.error('authFetch: Invalid Edge Function URL format:', finalUrl);
    throw new Error(`Invalid Edge Function URL: ${finalUrl}`);
  }
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);
  headers.set('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY!);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (import.meta.env.DEV) {
    console.log('authFetch: Making request:', {
      url: finalUrl,
      method: init.method || 'GET',
      hasAuth: !!session.access_token,
      hasApiKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
  }
  
  let res;
  try {
    res = await fetch(finalUrl, { ...init, headers });
  } catch (fetchError) {
    console.error('authFetch: Network error:', fetchError);
    throw new Error(`Network error: ${fetchError.message}. Check your VITE_SUPABASE_URL configuration.`);
  }
  
  if (import.meta.env.DEV) {
    console.log('authFetch: Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
  }
  
  return res;
}