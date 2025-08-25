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

    // Get stored GSC tokens
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('client_id', clientId)
      .eq('service_name', 'gsc')
      .eq('credential_type', 'access_token')
      .single()

    if (error || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No GSC credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = atob(credentials.encrypted_value)

    // Fetch sites from Google Search Console API
    const sites = await fetchGSCSites(accessToken)

    return new Response(
      JSON.stringify({
        success: true,
        sites
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching GSC sites:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
      
      if (sitesData.siteEntry) {
        sites.push(...sitesData.siteEntry.map((site: any) => ({
          id: site.siteUrl,
          displayName: site.siteUrl,
          permissionLevel: site.permissionLevel || 'siteOwner'
        })))
      }
    }
  } catch (error) {
    console.error('Error fetching GSC sites:', error)
  }
  
  return sites
}