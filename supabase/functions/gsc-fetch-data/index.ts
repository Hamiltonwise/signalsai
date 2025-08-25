import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    .eq('service_name', 'gsc')

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
        client_id: Deno.env.get('GOOGLE_GSC_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_GSC_CLIENT_SECRET')!,
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
        .eq('service_name', 'gsc')
        .eq('credential_type', 'access_token')

      return newTokens.access_token
    } else {
      const errorText = await refreshResponse.text();
      console.error('Failed to refresh GSC access token:', refreshResponse.status, errorText);
      throw new Error(`Failed to refresh GSC access token: ${errorText}`);
    }
  }

  return tokens.access_token
}

const calculateGSCScore = (metrics: {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}): number => {
  let score = 0;

  // Impressions score (0-20 points)
  const impressions = metrics.impressions || 0;
  score += Math.min(impressions / 1000 * 20, 20);

  // Clicks score (0-30 points)
  const clicks = metrics.clicks || 0;
  score += Math.min(clicks / 100 * 30, 30);

  // CTR score (0-25 points)
  const ctr = metrics.ctr || 0;
  score += Math.min(ctr * 100 * 0.25, 25);

  // Position score (0-25 points) - lower position is better
  const position = metrics.position || 100;
  const positionScore = Math.max(25 - (position - 1) * 2.5, 0);
  score += positionScore;

  return Math.round(Math.min(score, 100));
}

const processGSCResponse = (data: any, clientId: string, siteUrl: string) => {
  const rows = data.rows || []
  const processedData = []

  console.log('=== GSC API Response Processing Debug ===')
  console.log('Total rows received:', rows.length)
  console.log('Sample row structure:', rows[0] ? {
    keys: rows[0].keys,
    clicks: rows[0].clicks,
    impressions: rows[0].impressions,
    ctr: rows[0].ctr,
    position: rows[0].position
  } : 'No rows available')

  console.log('Processing real GSC data from API...')
  
  // Helper function to normalize device type
  const normalizeDevice = (device: string): 'desktop' | 'mobile' | 'tablet' => {
    if (!device) return 'desktop'
    
    const deviceLower = device.toLowerCase()
    
    if (deviceLower.includes('mobile') || deviceLower === 'mobile') {
      return 'mobile'
    } else if (deviceLower.includes('tablet') || deviceLower === 'tablet') {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  for (const row of rows) {
    const date = row.keys[0]
    const impressions = Number(row.impressions) || 0
    const clicks = Number(row.clicks) || 0
    const ctr = Number(row.ctr) || 0
    const position = Number(row.position) || 0

    console.log(`=== Processing GSC Row for ${date} ===`, {
      rawRow: row,
      keys: row.keys,
      rawClicks: row.clicks,
      rawImpressions: row.impressions,
      parsedClicks: clicks,
      parsedImpressions: impressions,
      finalImpressions: impressions,
      finalClicks: clicks,
      finalCTR: ctr,
      finalPosition: position,
      clicksIsZero: clicks === 0,
      impressionsIsZero: impressions === 0,
      calculatedScore: calculateGSCScore({ impressions, clicks, ctr, position })
    })

    const record = {
      client_id: clientId,
      date,
      query: row.keys[1] || null,
      page: row.keys[2] || null,
      impressions,
      clicks,
      ctr,
      position,
      country: 'USA',
      device: normalizeDevice(row.keys[3]),
      calculated_score: calculateGSCScore({ impressions, clicks, ctr, position })
    }

    console.log(`✅ GSC Record Created for ${date}:`, {
      clicks: record.clicks,
      impressions: record.impressions,
      ctr: record.ctr,
      position: record.position,
      score: record.calculated_score
    })

    processedData.push(record)
  }

  console.log('=== Final GSC Processed Data Summary ===')
  console.log('Total processed records:', processedData.length)
  console.log('Total clicks across all days:', processedData.reduce((sum, record) => sum + record.clicks, 0))
  console.log('Total impressions across all days:', processedData.reduce((sum, record) => sum + record.impressions, 0))
  console.log('Average position across all records:', processedData.length > 0 ? 
    processedData.reduce((sum, record) => sum + record.position, 0) / processedData.length : 0)

  return processedData
}

const storeGSCMetrics = async (data: any[]) => {
  if (data.length === 0) return

  // Insert new data (GSC can have multiple entries per date for different queries/pages)
  const { error } = await supabase
    .from('gsc_metrics')
    .insert(data)

  if (error) {
    throw new Error(`Failed to store GSC metrics: ${error.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== GSC Fetch Data Function Called ===')
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
    
    const { clientId, siteUrl, startDate, endDate } = body

    if (!clientId || !siteUrl || !startDate || !endDate) {
      console.log('Missing required parameters:', { clientId: !!clientId, siteUrl: !!siteUrl, startDate: !!startDate, endDate: !!endDate })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, siteUrl, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stored tokens
    const tokens = await getStoredTokens(clientId)
    console.log('Retrieved tokens:', { hasAccessToken: !!tokens?.access_token, hasRefreshToken: !!tokens?.refresh_token })
    
    if (!tokens) {
      console.log('No GSC tokens found for client:', clientId)
      return new Response(
        JSON.stringify({ error: 'No GSC tokens found for client' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token if needed
    console.log('Checking if token refresh is needed...')
    const accessToken = await refreshAccessTokenIfNeeded(clientId, tokens)
    console.log('Using access token (first 20 chars):', accessToken?.substring(0, 20) + '...')

    // Fetch data from GSC API
    console.log('Fetching data from Google Search Console API...')
    console.log('Site URL:', siteUrl)
    console.log('Date range:', { startDate, endDate })
    
    const gscApiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`

    const response = await fetch(
      gscApiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['date', 'query', 'page', 'device'],
          rowLimit: 5000,
        })
      }
    )

    console.log('GSC API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('GSC API error:', response.status, errorText)
      throw new Error(`GSC API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('GSC API response summary:', {
      totalRows: data.rows?.length || 0,
      sampleRow: data.rows?.[0] || null
    })
    if (data.rows && data.rows.length > 0) {
      console.log('Sample GSC API row:', data.rows[0])
      const totalClicks = data.rows.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0)
      const totalImpressions = data.rows.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0)
      console.log('Total clicks in API response:', totalClicks)
      console.log('Total impressions in API response:', totalImpressions)
    }

    // Process and store the data
    console.log('=== Processing GSC Data ===')
    console.log('Processing and storing GSC data...')
    const processedData = processGSCResponse(data, clientId, siteUrl)
    console.log('Processed data count:', processedData.length, 'records')
    if (processedData.length > 0) {
      console.log('Sample processed record:', processedData[0])
      const totalClicksProcessed = processedData.reduce((sum, record) => sum + record.clicks, 0)
      const totalImpressionsProcessed = processedData.reduce((sum, record) => sum + record.impressions, 0)
      console.log('Total clicks in processed data:', totalClicksProcessed)
      console.log('Total impressions in processed data:', totalImpressionsProcessed)
    }
    
    console.log('=== Storing GSC Data ===')
    await storeGSCMetrics(processedData)
    console.log('GSC data stored successfully -', processedData.length, 'records')

    return new Response(
      JSON.stringify({
        success: true,
        data: processedData,
        message: 'GSC data fetched and stored successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching GSC data:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: `Failed to fetch GSC data: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})