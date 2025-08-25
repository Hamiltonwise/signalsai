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
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')

    if (!provider) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Missing provider parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    
    if (!googleClientId || !supabaseUrl) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Missing Google OAuth configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redirectUri = `${supabaseUrl}/functions/v1/${provider}-callback`
    let scopes: string

    // Use provider-specific callback URLs (original pattern)
    switch (provider) {
      case 'ga4':
        scopes = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/analytics.manage.users.readonly'
        break

      case 'gsc':
        scopes = 'https://www.googleapis.com/auth/webmasters.readonly'
        break

      case 'gbp':
        scopes = 'https://www.googleapis.com/auth/business.manage'
        break

      default:
        return new Response(
          JSON.stringify({ ok: false, message: `Unsupported provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${crypto.randomUUID()}`

    return new Response(
      JSON.stringify({ ok: true, url: authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('OAuth start error:', error)
    return new Response(
      JSON.stringify({ ok: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})