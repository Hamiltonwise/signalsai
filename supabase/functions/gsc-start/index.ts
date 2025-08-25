const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:5173';
    const googleClientId = Deno.env.get('GOOGLE_GSC_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!googleClientId || !supabaseUrl) {
      const errorUrl = `${appOrigin}/oauth/callback?provider=gsc&status=error&error=missing_config`;
      return new Response(null, {
        status: 303,
        headers: {
          'Location': errorUrl,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const redirectUri = `${supabaseUrl}/functions/v1/gsc-callback`;
    const state = crypto.randomUUID();

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', googleClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    console.log('GSC Start: Redirecting to Google OAuth');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': url.toString(),
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('GSC Start error:', error);
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:5173';
    const errorUrl = `${appOrigin}/oauth/callback?provider=gsc&status=error&error=${encodeURIComponent(error.message)}`;
    
    return new Response(null, {
      status: 303,
      headers: {
        'Location': errorUrl,
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
})