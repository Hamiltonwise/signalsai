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

const decryptData = (encryptedData: string): string => {
  // Simple base64 decoding for demo - in production use proper decryption
  return atob(encryptedData)
}

const getStoredTokens = async (clientId: string) => {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('service_name', 'ga4')

  if (error || !data || data.length === 0) {
    return null
  }

  const tokens: any = {}
  data.forEach(cred => {
    tokens[cred.credential_type] = decryptData(cred.encrypted_value)
    if (cred.expiration_date) {
      tokens.expiry_date = new Date(cred.expiration_date).getTime()
    }
  })

  return tokens
}

const refreshAccessTokenIfNeeded = async (clientId: string, tokens: any): Promise<string> => {
  const now = Date.now()
  const expiryTime = tokens.expiry_date || 0

  // If token expires in less than 5 minutes, refresh it
  if (expiryTime - now < 5 * 60 * 1000 && tokens.refresh_token) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: tokens.refresh_token,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        grant_type: 'refresh_token'
      })
    })

    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json()
      
      // Update stored access token
      await supabase
        .from('api_credentials')
        .update({
          encrypted_value: btoa(newTokens.access_token),
          expiration_date: newTokens.expires_in ? 
            new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('service_name', 'ga4')
        .eq('credential_type', 'access_token')

      return newTokens.access_token
    }
  }

  return tokens.access_token
}

const calculateGA4Score = (metrics: {
  engagement_rate: number
  conversions: number
  bounce_rate: number
  pages_per_session: number
}): number => {
  let score = 0

  // Engagement rate (0-40 points)
  score += Math.min(metrics.engagement_rate * 100 * 0.4, 40)

  // Conversions (0-30 points) - normalized for dental practices
  const conversionScore = Math.min(metrics.conversions * 2, 30)
  score += conversionScore

  // Bounce rate (0-20 points) - lower is better
  const bounceScore = Math.max(20 - (metrics.bounce_rate * 100 * 0.2), 0)
  score += bounceScore

  // Pages per session (0-10 points)
  score += Math.min(metrics.pages_per_session * 3, 10)

  return Math.round(Math.min(score, 100))
}

const processGA4Response = (data: any, clientId: string) => {
  const rows = data.rows || []
  const processedData = []

  console.log('=== GA4 API Response Processing Debug ===')
  console.log('Total rows received:', rows.length)
  console.log('Sample row structure:', rows[0] ? {
    dimensionValues: rows[0].dimensionValues,
    metricValues: rows[0].metricValues
  } : 'No rows available')
  for (const row of rows) {
    const date = row.dimensionValues[0].value
    const metrics = row.metricValues

    console.log(`Processing row for date ${date}:`, {
      rawMetrics: metrics,
      metricValues: metrics.map((m, i) => `[${i}]: ${m.value}`),
      newUsers: metrics[0]?.value,
      totalUsers: metrics[1]?.value,
      sessions: metrics[2]?.value,
      engagementRate: metrics[3]?.value,
      conversions: metrics[4]?.value,
      avgSessionDuration: metrics[5]?.value,
      bounceRate: metrics[6]?.value,
      pagesPerSession: metrics[7]?.value
    })
    const record = {
      client_id: clientId,
      date,
      new_users: parseInt(metrics[0].value) || 0,
      total_users: parseInt(metrics[1].value) || 0,
      sessions: parseInt(metrics[2].value) || 0,
      engagement_rate: parseFloat(metrics[3].value) || 0,
      conversions: parseInt(metrics[4].value) || 0,
      avg_session_duration: parseFloat(metrics[5].value) || 0,
      bounce_rate: parseFloat(metrics[6].value) || 0,
      pages_per_session: parseFloat(metrics[7].value) || 0,
      calculated_score: calculateGA4Score({
        engagement_rate: parseFloat(metrics[3].value) || 0,
        conversions: parseInt(metrics[4].value) || 0,
        bounce_rate: parseFloat(metrics[6].value) || 0,
        pages_per_session: parseFloat(metrics[7].value) || 0
      })
    }

    console.log(`Processed record for ${date}:`, record)
    processedData.push(record)
  }

  console.log('=== Final Processed Data Summary ===')
  console.log('Total processed records:', processedData.length)
  console.log('Total sessions across all days:', processedData.reduce((sum, record) => sum + record.sessions, 0))
  console.log('Total users across all days:', processedData.reduce((sum, record) => sum + record.total_users, 0))
  return processedData
}

const storeGA4Metrics = async (data: any[]) => {
  if (data.length === 0) return

  // Use upsert to handle duplicate dates
  const { error } = await supabase
    .from('ga4_metrics')
    .upsert(data, {
      onConflict: 'client_id,date'
    })

  if (error) {
    throw new Error(`Failed to store GA4 metrics: ${error.message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== GA4 Fetch Data Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    console.log('Request body:', body)
    
    const { clientId, propertyId, startDate, endDate } = body

    if (!clientId || !propertyId || !startDate || !endDate) {
      console.log('Missing required parameters:', { clientId: !!clientId, propertyId: !!propertyId, startDate: !!startDate, endDate: !!endDate })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, propertyId, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stored tokens
    const tokens = await getStoredTokens(clientId)
    console.log('Retrieved tokens:', { hasAccessToken: !!tokens?.access_token, hasRefreshToken: !!tokens?.refresh_token })
    
    if (!tokens) {
      console.log('No tokens found for client:', clientId)
      return new Response(
        JSON.stringify({ error: 'No GA4 tokens found for client' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token if needed
    console.log('Checking if token refresh is needed...')
    const accessToken = await refreshAccessTokenIfNeeded(clientId, tokens)
    console.log('Using access token (first 20 chars):', accessToken?.substring(0, 20) + '...')

    // Fetch data from GA4
    console.log('Fetching data from GA4 API...')
    console.log('Property ID:', propertyId)
    console.log('Date range:', { startDate, endDate })
    
    // Validate property ID format (should be numeric)
    if (!propertyId.match(/^\d+$/)) {
      throw new Error(`Invalid property ID format: ${propertyId}. Property ID should be numeric.`)
    }
    
    // Use the correct property ID for GA4 Reporting API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'newUsers' },
            { name: 'totalUsers' },
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'screenPageViewsPerSession' }
          ],
          dimensions: [{ name: 'date' }]
        })
      }
    )

    console.log('GA4 API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('GA4 API error:', response.status, errorText)
      
      // Enhanced error handling for common GA4 issues
      if (response.status === 502 || response.status === 503) {
        console.error('=== GA4 API Server Error ===')
        console.error('Google Analytics API is temporarily unavailable')
        console.error('This is a Google server issue, not a configuration problem')
        console.error('The API call was successful but Google servers returned an error')
        
        // For 502/503 errors, we should retry after a delay or use cached data
        throw new Error(`Google Analytics API is temporarily unavailable (${response.status}). This is a Google server issue. Please try again in a few minutes.`)
      }
      
      if (response.status === 403) {
        console.error('=== GA4 Data API Access Denied ===')
        console.error('This usually means:')
        console.error('1. User does not have access to this GA4 property')
        console.error('2. Property ID is incorrect or invalid')
        console.error('3. Analytics Data API is not enabled in Google Cloud Console')
        console.error('Property ID used:', propertyId)
        console.error('Property ID type:', typeof propertyId)
        console.error('Property ID format valid:', /^\d+$/.test(propertyId))
      }
      
      if (response.status === 400) {
        console.error('=== GA4 Data API Bad Request ===')
        console.error('This usually means:')
        console.error('1. Invalid property ID format')
        console.error('2. Invalid date range or metrics')
        console.error('Property ID used:', propertyId)
        console.error('Date range:', { startDate, endDate })
      }
      
      throw new Error(`GA4 API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('GA4 API response data:', JSON.stringify(data, null, 2))

    // Process and store the data
    console.log('=== Processing GA4 Data ===')
    console.log('Processing and storing GA4 data...')
    const processedData = processGA4Response(data, clientId)
    console.log('Processed data count:', processedData.length, 'records')
    if (processedData.length > 0) {
      console.log('Sample processed record:', processedData[0])
      console.log('Total users across all days:', processedData.reduce((sum, record) => sum + record.total_users, 0))
      console.log('Total sessions across all days:', processedData.reduce((sum, record) => sum + record.sessions, 0))
    }
    
    console.log('=== Storing GA4 Data ===')
    await storeGA4Metrics(processedData)
    console.log('GA4 data stored successfully -', processedData.length, 'records')

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        message: 'GA4 data fetched successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching GA4 data:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: `Failed to fetch GA4 data: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})