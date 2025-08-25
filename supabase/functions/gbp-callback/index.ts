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

  console.log('=== GBP Callback Function Called ===')
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
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=${encodeURIComponent(error)}`,
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
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=missing_code`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const googleClientId = Deno.env.get('GOOGLE_GBP_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_GBP_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=missing_credentials`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    // Exchange code for tokens
    console.log('Exchanging authorization code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/gbp-callback`,
        grant_type: 'authorization_code',
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=token_exchange_failed`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    const tokens = await tokenResponse.json()
    console.log('Token exchange successful. Access token (first 10 chars):', tokens.access_token?.substring(0, 10) + '...')
    console.log('Tokens received successfully')
    
    // Get GBP locations
    console.log('Fetching GBP locations...')
    const locations = await fetchGBPLocations(tokens.access_token)
    console.log('Locations found:', locations.length)
    
    // Store tokens in database (using state as temp client ID)
    const clientId = state
    if (!clientId) {
      console.error('Missing client ID in state parameter')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=missing_client_id`,
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
          'Location': `${appOrigin}/oauth/callback?provider=gbp&status=error&error=invalid_client_id_format`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    console.log('Storing tokens for client:', clientId)
    await storeTokens(clientId, tokens, supabaseUrl!)
    console.log('Tokens stored successfully for client:', clientId)
    console.log('Tokens stored successfully')
    
    // Redirect back to our app's callback page
    const locationsParam = encodeURIComponent(JSON.stringify(locations))
    const successUrl = `${appOrigin}/oauth/callback?provider=gbp&status=success&locations=${locationsParam}&popup=true`
    
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
    const errorUrl = `${appOrigin}/oauth/callback?provider=gbp&status=error&error=${encodeURIComponent(error.message)}`
    
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

async function fetchGBPLocations(accessToken: string) {
  const locations = []
  
  try {
    const accountsResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json()
      console.log('GBP accounts found:', accountsData.accounts?.length || 0)
      
      for (const account of accountsData.accounts || []) {
        try {
          const readMask = 'name,title,storefrontAddress'
          const locationsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${encodeURIComponent(readMask)}`
          
          const accountLocationsResponse = await fetch(locationsUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
          
          if (accountLocationsResponse.ok) {
            const accountLocations = await accountLocationsResponse.json()
            
            if (accountLocations.locations) {
              locations.push(...accountLocations.locations.map(loc => ({
                id: loc.name,
                displayName: loc.title || loc.displayName || loc.name,
                accountName: account.accountName || account.name
              })))
            }
          }
        } catch (locationFetchError) {
          console.error('Error fetching locations for account:', account.name, locationFetchError)
        }
      }
    }
  } catch (error) {
    console.error('Error fetching GBP accounts and locations:', error)
  }
  
  return locations
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
      service_name: 'gbp',
      credential_type: 'access_token',
      encrypted_value: btoa(tokens.access_token),
      expiration_date: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
    }
  ]
  
  if (tokens.refresh_token) {
    credentials.push({
      client_id: clientId,
      service_name: 'gbp',
      credential_type: 'refresh_token',
      encrypted_value: btoa(tokens.refresh_token)
    })
  }
  
  // Delete existing GBP tokens for this client
  await supabase
    .from('api_credentials')
    .delete()
    .eq('client_id', clientId)
    .eq('service_name', 'gbp')
  
  // Insert new tokens
  const { error } = await supabase
    .from('api_credentials')
    .insert(credentials)
  
  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`)
  }
  
  console.log('GBP credentials stored successfully for client:', clientId)
}