import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== GSC Callback Function Called ===')
  console.log('Request URL:', req.url)
  
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    // Use configurable app origin
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://hamiltonwisedashboard.netlify.app'
    
    console.log('Callback params:', { hasCode: !!code, state, error })
    
    if (error) {
      console.error('OAuth Error:', error)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=${encodeURIComponent(error)}`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    if (!code) {
      console.error('Missing authorization code')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=missing_code`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const googleClientId = Deno.env.get('GOOGLE_GSC_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_GSC_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=missing_credentials`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Validate client ID from state
    const clientId = state
    if (!clientId) {
      console.error('Missing client ID in state parameter')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=missing_client_id`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(clientId)) {
      console.error('Invalid client ID format:', clientId)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=invalid_client_id_format`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    console.log('Storing tokens for client:', clientId)
    console.log('Exchanging authorization code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/gsc-callback`,
        grant_type: 'authorization_code',
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gsc&status=error&error=token_exchange_failed`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    const tokens = await tokenResponse.json()
    console.log('Token exchange successful. Access token (first 10 chars):', tokens.access_token?.substring(0, 10) + '...')
    console.log('Tokens received successfully')
    
    // Get GSC sites
    console.log('Fetching GSC sites...')
    const sites = await fetchGSCSites(tokens.access_token)
    console.log('Sites found:', sites.length)
    
    // Store tokens in database
    console.log('Storing tokens for client:', clientId)
    await storeTokens(clientId, tokens, supabaseUrl!)
    console.log('Tokens stored successfully for client:', clientId)
    console.log('Tokens stored successfully')
    
    // Redirect back to our app's callback page with sites data
    const sitesParam = encodeURIComponent(JSON.stringify(sites))
    const successUrl = `${appOrigin}/oauth/callback?provider=gsc&status=success&sites=${sitesParam}&popup=true`
    
    return new Response(null, {
      status: 303,
      headers: {
        'Location': successUrl,
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'Access-Control-Allow-Origin': '*',
      }
    })
    
  } catch (error) {
    console.error('Callback error:', error)
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://hamiltonwisedashboard.netlify.app'
    const errorUrl = `${appOrigin}/oauth/callback?provider=gsc&status=error&error=${encodeURIComponent(error.message)}`
    
    return new Response(null, {
      status: 303,
      headers: {
        'Location': errorUrl,
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

async function fetchGSCSites(accessToken: string) {
  const sites = []
  
  try {
    const sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json()
      console.log('GSC sites found:', sitesData.siteEntry?.length || 0)
      
      if (sitesData.siteEntry) {
        sites.push(...sitesData.siteEntry.map((site: any) => ({
          id: site.siteUrl,
          displayName: site.siteUrl,
          permissionLevel: site.permissionLevel || 'siteOwner'
        })))
      }
    } else {
      const errorText = await sitesResponse.text()
      console.error('Failed to fetch GSC sites:', sitesResponse.status, errorText)
    }
  } catch (error) {
    console.error('Error fetching GSC sites:', error)
  }
  
  return sites
}

async function storeTokens(clientId: string, tokens: any, supabaseUrl: string) {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const credentials = [
    {
      client_id: clientId,
      service_name: 'gsc',
      credential_type: 'access_token',
      encrypted_value: btoa(tokens.access_token),
      expiration_date: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
    }
  ]
  
  if (tokens.refresh_token) {
    credentials.push({
      client_id: clientId,
      service_name: 'gsc',
      credential_type: 'refresh_token',
      encrypted_value: btoa(tokens.refresh_token)
    })
  }
  
  // Delete existing GSC tokens for this client
  await supabase
    .from('api_credentials')
    .delete()
    .eq('client_id', clientId)
    .eq('service_name', 'gsc')
  
  // Insert new tokens
  const { error } = await supabase
    .from('api_credentials')
    .insert(credentials)
  
  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`)
  }
  
  console.log('GSC credentials stored successfully for client:', clientId)
}