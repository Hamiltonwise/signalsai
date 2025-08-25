import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId')

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stored GBP tokens
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('client_id', clientId)
      .eq('service_name', 'gbp')
      .eq('credential_type', 'access_token')
      .single()

    if (error || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No GBP credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = atob(credentials.encrypted_value)

    // Fetch locations from Google Business Profile API
    const locations = await fetchGBPLocations(accessToken)

    return new Response(
      JSON.stringify({
        success: true,
        locations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching GBP locations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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