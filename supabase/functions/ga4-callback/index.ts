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

  console.log('=== GA4 Callback Function Called ===')
  console.log('Request URL:', req.url)
  
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://hamiltonwisedashboard.netlify.app'
    
    console.log('Callback params:', { hasCode: !!code, state, error })
    
    if (error) {
      console.error('OAuth Error:', error)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=${encodeURIComponent(error)}&popup=true`,
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
          'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=missing_code&popup=true`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials')
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=missing_credentials&popup=true`,
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
          'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=missing_client_id&popup=true`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    console.log('Exchanging authorization code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/ga4-callback`,
        grant_type: 'authorization_code',
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(null, {
        status: 303,
        headers: {
          'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=token_exchange_failed&popup=true`,
          'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    const tokens = await tokenResponse.json()
    console.log('Token exchange successful. Access token (first 10 chars):', tokens.access_token?.substring(0, 10) + '...')
    console.log('Tokens received successfully')
    
    // Get GA4 properties using the WORKING approach
    console.log('Fetching GA4 properties...')
    const properties = await fetchGA4Properties(tokens.access_token)
    console.log('Properties found:', properties.length)
    
    // Store tokens in database
    console.log('Storing tokens for client:', clientId)
    await storeTokens(clientId, tokens, supabaseUrl!)
    console.log('Tokens stored successfully for client:', clientId)
    console.log('Tokens stored successfully')
    
    // Redirect to our OAuthCallback component with properties data
    const propertiesParam = encodeURIComponent(JSON.stringify(properties))
    const successUrl = `${appOrigin}/oauth/callback?provider=ga4&status=success&properties=${propertiesParam}&popup=true`
    
    console.log('GA4 Callback: Redirecting to success URL with', properties.length, 'properties')
    
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
    return new Response(null, {
      status: 303,
      headers: {
        'Location': `${appOrigin}/oauth/callback?provider=ga4&status=error&error=${encodeURIComponent(error.message)}&popup=true`,
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})

async function fetchGA4Properties(accessToken: string) {
  const properties = []
  
  try {
    console.log('=== Fetching GA4 Properties - Using Working Approach ===')
    
    // Use the Analytics Reporting API to get account summaries (this was working before)
    const accountSummariesResponse = await fetch('https://analyticsadmin.googleapis.com/v1alpha/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    
    console.log('Account summaries response status:', accountSummariesResponse.status)
    
    if (!accountSummariesResponse.ok) {
      const errorText = await accountSummariesResponse.text()
      console.error('Failed to fetch account summaries:', accountSummariesResponse.status, errorText)
      return properties
    }
    
    const summariesData = await accountSummariesResponse.json()
    console.log('=== Account Summaries Found ===')
    console.log('Account summaries:', summariesData.accountSummaries?.length || 0)
    
    // Process each account summary to get properties
    for (const accountSummary of summariesData.accountSummaries || []) {
      console.log(`=== Processing Account Summary: ${accountSummary.displayName} ===`)
      
      // Each account summary contains property summaries
      for (const propertySummary of accountSummary.propertySummaries || []) {
        console.log(`=== Processing Property Summary: ${propertySummary.displayName} ===`)
        
        // Extract property ID from property.property (format: "properties/123456789")
        const propertyId = propertySummary.property?.split('/')[1]
        
        if (propertyId && propertySummary.displayName) {
          // Enhanced domain hint detection
          const displayNameLower = propertySummary.displayName.toLowerCase()
          let domainHint = 'unknown'
          
          if (displayNameLower.includes('hamilton') || displayNameLower.includes('hamiltonwise')) {
            domainHint = 'hamilton-wise'
          } else if (displayNameLower.includes('tricity') || displayNameLower.includes('endodontics')) {
            domainHint = 'tricity-endodontics'
          } else if (displayNameLower.includes('dental') || displayNameLower.includes('orthodontics')) {
            domainHint = 'dental-practice'
          }
          
          properties.push({
            id: propertyId,
            displayName: propertySummary.displayName,
            accountName: accountSummary.displayName || 'Unknown Account',
            domainHint: domainHint
          })
          console.log(`Added GA4 property: ${propertySummary.displayName} (ID: ${propertyId}, Account: ${accountSummary.displayName}, Hint: ${domainHint})`)
        }
      }
    }
  } catch (error) {
    console.error('Error fetching GA4 properties:', error)
  }
  
  console.log('=== Final GA4 Properties Result ===')
  console.log('Total properties found:', properties.length)
  properties.forEach((prop, index) => {
    console.log(`Property ${index + 1}:`, {
      id: prop.id,
      displayName: prop.displayName,
      accountName: prop.accountName,
      domainHint: prop.domainHint
    })
  })
  
  return properties
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
      service_name: 'ga4',
      credential_type: 'access_token',
      encrypted_value: btoa(tokens.access_token),
      expiration_date: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
    }
  ]
  
  if (tokens.refresh_token) {
    credentials.push({
      client_id: clientId,
      service_name: 'ga4',
      credential_type: 'refresh_token',
      encrypted_value: btoa(tokens.refresh_token)
    })
  }
  
  // Delete existing GA4 tokens for this client
  await supabase
    .from('api_credentials')
    .delete()
    .eq('client_id', clientId)
    .eq('service_name', 'ga4')
  
  // Insert new tokens
  const { error } = await supabase
    .from('api_credentials')
    .insert(credentials)
  
  if (error) {
    throw new Error(`Failed to store credentials: ${error.message}`)
  }
  
  console.log('GA4 credentials stored successfully for client:', clientId)
}