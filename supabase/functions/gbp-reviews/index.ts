import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-id, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';"
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  console.log(`[gbp-reviews] ${requestId} start ${req.method} ${new URL(req.url).pathname}`)

  try {
    if (req.method !== 'GET') {
      return j({ ok: false, code: 'method_not_allowed', message: 'Only GET method supported' }, 405)
    }

    const url = new URL(req.url)
    let clientId = url.searchParams.get('clientId') || 
                   req.headers.get('x-client-id') || 
                   null

    // If no clientId provided, try to infer from active GBP connections
    if (!clientId) {
      console.log(`[gbp-reviews] ${requestId} no clientId provided, attempting to infer from active connections`)
      
      // Get the most recent active GBP connection
      const { data: activeConnections, error: connectionsError } = await supabase
        .from('integration_accounts')
        .select('client_id, created_at')
        .eq('platform', 'gbp')
        .eq('connection_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!connectionsError && activeConnections && activeConnections.length > 0) {
        clientId = activeConnections[0].client_id
        console.log(`[gbp-reviews] ${requestId} inferred clientId from active connection: ${clientId}`)
      }
      
      if (!clientId) {
        return j({ ok: false, code: 'missing_client_id', message: 'No clientId provided and no active GBP connections found' }, 400)
      }
    }

    console.log(`[gbp-reviews] ${requestId} fetching reviews for client: ${clientId}`)

    // Get Google access token using existing credential system
    const accessToken = await getGoogleAccessTokenForClient(clientId)
    console.log(`[gbp-reviews] ${requestId} access token retrieved (length: ${accessToken.length})`)

    // Get stored locations from existing integration data
    const locations = await getSelectedGBPLocations(clientId)
    console.log(`[gbp-reviews] ${requestId} found ${locations.length} selected locations`)

    if (locations.length === 0) {
      console.log(`[gbp-reviews] ${requestId} no selected locations found, using demo data`)
      // Try to get stored reviews from database instead of generating demo data
      const { data: storedReviews, error: storedError } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('ai_score', { ascending: false })
        .limit(50)

      if (!storedError && storedReviews && storedReviews.length > 0) {
        console.log(`[gbp-reviews] ${requestId} returning ${storedReviews.length} stored reviews (no locations selected)`)
        return j({
          ok: true,
          data: storedReviews,
          message: 'Returned stored reviews (no GBP locations currently selected)',
          source: 'database',
          locationsProcessed: 0
        })
      }

      return j({
        ok: false,
        code: 'no_locations',
        message: 'No GBP locations selected and no stored reviews found. Please select locations in Settings.',
        data: [],
        source: 'none',
        locationsProcessed: 0
      })
    }

    console.log(`[gbp-reviews] ${requestId} attempting to fetch REAL reviews from Google Business API`)
    
    // Fetch REAL reviews from selected locations using Google Business API
    const allReviews = []
    let successfulLocations = 0
    let totalApiReviews = 0

    for (const location of locations) {
      try {
        console.log(`[gbp-reviews] ${requestId} === FETCHING REAL REVIEWS for location: ${location.displayName} ===`)
        const locationReviews = await fetchReviewsForLocation(accessToken, location)
        totalApiReviews += locationReviews.length
        
        if (locationReviews.length > 0) {
          successfulLocations++
          console.log(`[gbp-reviews] ${requestId} ✅ REAL API SUCCESS: found ${locationReviews.length} reviews for ${location.displayName}`)
          
          // Process each review with AI analysis
          for (const review of locationReviews) {
            console.log(`[gbp-reviews] ${requestId} processing real review from ${review.reviewer?.displayName || 'Anonymous'}: ${review.starRating}★`)
            const aiAnalysis = await analyzeReviewWithAI(review.comment || '', review.starRating || 5)
            
            const processedReview = {
              client_id: clientId,
              review_text: review.comment || '',
              rating: review.starRating || 5,
              author_name: review.reviewer?.displayName || 'Anonymous',
              review_date: review.createTime ? new Date(review.createTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              platform: 'gbp',
              ai_score: aiAnalysis.score,
              ai_keywords: JSON.stringify(aiAnalysis.keywords),
              effectiveness_rating: aiAnalysis.effectiveness,
              sentiment: aiAnalysis.sentiment,
              response_status: review.reviewReply ? 'responded' : 'pending',
              external_review_id: review.name || `${clientId}-${Date.now()}-${Math.random()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            allReviews.push(processedReview)
          }
        } else {
          console.log(`[gbp-reviews] ${requestId} ⚠️ No reviews found for location: ${location.displayName}`)
        }
      } catch (locationError) {
        console.error(`[gbp-reviews] ${requestId} ❌ API ERROR for location ${location.displayName}:`, locationError.message)
      }
    }

    console.log(`[gbp-reviews] ${requestId} === STORING REAL REVIEWS IN DATABASE ===`)
    console.log(`[gbp-reviews] ${requestId} Total API reviews fetched: ${totalApiReviews}`)
    console.log(`[gbp-reviews] ${requestId} Processed reviews to store: ${allReviews.length}`)
    
    if (allReviews.length > 0) {
      const storeResult = await storeReviewsInDatabase(allReviews)
      console.log(`[gbp-reviews] ${requestId} ✅ STORED ${allReviews.length} REAL REVIEWS in database`)
      console.log(`[gbp-reviews] ${requestId} Storage result:`, storeResult)
    } else {
      console.log(`[gbp-reviews] ${requestId} ⚠️ No reviews to store - API returned empty results`)
    }

    console.log(`[gbp-reviews] ${requestId} === FINAL RESULT ===`)
    console.log(`[gbp-reviews] ${requestId} Real reviews fetched: ${allReviews.length}`)
    console.log(`[gbp-reviews] ${requestId} Successful locations: ${successfulLocations}/${locations.length}`)
    console.log(`[gbp-reviews] ${requestId} Source: ${allReviews.length > 0 ? 'REAL_GBP_API' : 'NO_REVIEWS_FOUND'}`)

    return j({
      ok: true,
      data: allReviews,
      message: `Fetched ${allReviews.length} REAL reviews from ${successfulLocations} location(s) via Google Business API`,
      source: allReviews.length > 0 ? 'gbp_api' : 'no_reviews_found',
      locationsProcessed: successfulLocations
    })

  } catch (error) {
    console.error(`[gbp-reviews] ${requestId} error:`, error)
    
    // On error, try to return stored reviews from database instead of demo data
    try {
      console.log(`[gbp-reviews] ${requestId} ❌ API FAILED, checking for stored reviews...`)
      
      const { data: storedReviews, error: storedError } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', clientId || 'demo')
        .order('ai_score', { ascending: false })
        .limit(50)

      if (!storedError && storedReviews && storedReviews.length > 0) {
        console.log(`[gbp-reviews] ${requestId} ✅ FALLBACK SUCCESS: returning ${storedReviews.length} stored reviews`)
        return j({
          ok: true,
          data: storedReviews,
          message: `API failed, returned ${storedReviews.length} stored reviews. Error: ${error.message}`,
          source: 'database_fallback',
          error: error.message
        })
      }
      
      // Only generate demo reviews as absolute last resort
      console.log(`[gbp-reviews] ${requestId} ⚠️ No stored reviews found, generating demo as last resort`)
      const demoReviews = await generateDemoReviews(clientId || 'demo')
      return j({
        ok: true,
        data: demoReviews,
        message: `API failed and no stored reviews found. Using demo data. Error: ${error.message}`,
        source: 'demo_fallback',
        error: error.message
      })
    } catch (demoError) {
      console.error(`[gbp-reviews] ${requestId} ❌ Even demo fallback failed:`, demoError)
      return j({ ok: false, code: 'unhandled', message: error.message }, 500)
    }
  } finally {
    console.log(`[gbp-reviews] ${requestId} end`)
  }
})

// --- Helper Functions ---

/**
 * Get Google access token using existing credential system
 */
async function getGoogleAccessTokenForClient(clientId: string): Promise<string> {
  console.log(`[gbp-reviews] getting access token for client: ${clientId}`)
  
  // Get stored GBP tokens from existing api_credentials table
  const { data: credentials, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('service_name', 'gbp')

  if (error || !credentials || credentials.length === 0) {
    throw new Error('No GBP credentials found for client')
  }

  console.log(`[gbp-reviews] found ${credentials.length} GBP credentials`)

  // Find access token and refresh token
  const accessTokenCred = credentials.find(c => c.credential_type === 'access_token')
  const refreshTokenCred = credentials.find(c => c.credential_type === 'refresh_token')

  if (!accessTokenCred) {
    throw new Error('No access token found for client')
  }

  // Decrypt token (simple base64 for demo)
  const accessToken = atob(accessTokenCred.encrypted_value)
  
  // Check if token needs refresh
  const now = Date.now()
  const expiryTime = accessTokenCred.expiration_date ? new Date(accessTokenCred.expiration_date).getTime() : 0

  if (expiryTime - now < 5 * 60 * 1000 && refreshTokenCred) {
    console.log(`[gbp-reviews] refreshing access token (expires in ${Math.floor((expiryTime - now) / 1000)}s)`)
    
    const refreshToken = atob(refreshTokenCred.encrypted_value)
    const newAccessToken = await refreshGoogleAccessToken(refreshToken, clientId)
    return newAccessToken
  }

  return accessToken
}

/**
 * Refresh Google access token
 */
async function refreshGoogleAccessToken(refreshToken: string, clientId: string): Promise<string> {
  const params = new URLSearchParams()
  params.set('client_id', (Deno.env.get('GOOGLE_GBP_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')) ?? '')
  params.set('client_secret', (Deno.env.get('GOOGLE_GBP_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')) ?? '')
  params.set('refresh_token', refreshToken)
  params.set('grant_type', 'refresh_token')

  console.log(`[gbp-reviews] refreshing token with client_id: ${params.get('client_id')?.substring(0, 20)}...`)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  const tokenJson = await tokenRes.json().catch(() => ({}))
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error('[gbp-reviews] token refresh error:', {
      status: tokenRes.status,
      error: tokenJson.error,
      error_description: tokenJson.error_description,
      client_id_used: params.get('client_id')?.substring(0, 20) + '...',
      has_refresh_token: !!refreshToken
    })
    throw new Error('Failed to refresh access token')
  }

  console.log(`[gbp-reviews] token refresh successful, new token length: ${tokenJson.access_token.length}`)

  // Update stored access token
  await supabase
    .from('api_credentials')
    .update({
      encrypted_value: btoa(tokenJson.access_token),
      expiration_date: tokenJson.expires_in ? 
        new Date(Date.now() + tokenJson.expires_in * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('client_id', clientId)
    .eq('service_name', 'gbp')
    .eq('credential_type', 'access_token')

  return tokenJson.access_token
}

/**
 * Get stored GBP locations from existing integration data
 */
async function getSelectedGBPLocations(clientId: string) {
  console.log(`[gbp-reviews] getting selected locations for client: ${clientId}`)
  
  // First check if we have GBP credentials (main integration storage)
  const { data: credentials, error: credError } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('service_name', 'gbp')

  if (credError || !credentials || credentials.length === 0) {
    console.log('[gbp-reviews] no GBP credentials found in api_credentials table')
    
    // Fallback: check integration_accounts table
    const { data: integration, error: integrationError } = await supabase
      .from('integration_accounts')
      .select('metadata, encrypted_credentials')
      .eq('client_id', clientId)
      .eq('platform', 'gbp')
      .eq('connection_status', 'active')
      .single()

    if (integrationError || !integration) {
      console.log('[gbp-reviews] no GBP integration found in either table')
      return []
    }
    
    console.log('[gbp-reviews] found GBP integration in integration_accounts table')
  } else {
    console.log('[gbp-reviews] found GBP credentials in api_credentials table')
  }

  // CRITICAL: Get the SPECIFIC locations selected by the user during GBP setup
  // Check integration_accounts metadata for selectedLocations (set by frontend during connection)
  const { data: integration } = await supabase
    .from('integration_accounts')
    .select('metadata')
    .eq('client_id', clientId)
    .eq('platform', 'gbp')
    .eq('connection_status', 'active')
    .single()

  let selectedLocationIds = []
  if (integration?.metadata?.selectedLocations) {
    selectedLocationIds = integration.metadata.selectedLocations
    console.log(`[gbp-reviews] found ${selectedLocationIds.length} SELECTED location IDs from user choice:`, selectedLocationIds)
  } else {
    console.log('[gbp-reviews] ⚠️ NO SELECTED LOCATIONS found in metadata - user may not have completed location selection')
  }
  
  // Get ALL available locations from stored credentials
  let storedLocations = []
  
  // Check if locations are stored in api_credentials metadata
  const accessTokenCred = credentials?.find(c => c.credential_type === 'access_token')
  if (accessTokenCred?.metadata?.locations) {
    storedLocations = accessTokenCred.metadata.locations
    console.log(`[gbp-reviews] found ${storedLocations.length} locations in api_credentials metadata`)
  }
  
  // If no locations in api_credentials, check integration_accounts
  if (storedLocations.length === 0) {
    if (integration?.metadata?.locations) {
      storedLocations = integration.metadata.locations
      console.log(`[gbp-reviews] found ${storedLocations.length} locations in integration_accounts metadata`)
    }
  }
  
  // If still no stored locations, fetch them from the API
  if (storedLocations.length === 0) {
    console.log('[gbp-reviews] no stored locations found, fetching from API...')
    try {
      const accessToken = await getGoogleAccessTokenForClient(clientId)
      storedLocations = await fetchGBPLocationsFromAPI(accessToken)
      console.log(`[gbp-reviews] fetched ${storedLocations.length} locations from API`)
      
      // Store the fetched locations for future use
      if (storedLocations.length > 0) {
        await storeGBPLocations(clientId, storedLocations)
      }
    } catch (fetchError) {
      console.error('[gbp-reviews] failed to fetch locations from API:', fetchError.message)
      return []
    }
  }

  console.log(`[gbp-reviews] === LOCATION SELECTION VALIDATION ===`)
  console.log(`[gbp-reviews] Available locations: ${storedLocations.length}`)
  console.log(`[gbp-reviews] User selected: ${selectedLocationIds.length}`)
  
  if (selectedLocationIds.length === 0) {
    console.log('[gbp-reviews] ❌ NO LOCATIONS SELECTED by user')
    console.log('[gbp-reviews] This means the user has not completed the GBP location selection step')
    console.log('[gbp-reviews] Available locations that could be selected:', storedLocations.map(l => l.displayName))
    console.log('[gbp-reviews] User needs to go to Settings → GBP → Select Location(s)')
    
    // TEMPORARY DEBUG: Check if user selected by displayName instead of ID
    console.log(`[gbp-reviews] === DEBUGGING LOCATION SELECTION MISMATCH ===`)
    console.log(`[gbp-reviews] Stored selectedLocationIds:`, selectedLocationIds)
    console.log(`[gbp-reviews] Available location IDs:`, storedLocations.map(l => l.id))
    console.log(`[gbp-reviews] Available location displayNames:`, storedLocations.map(l => l.displayName))
    
    // Try to match by displayName if ID matching fails
    const locationsByDisplayName = storedLocations.filter(loc => 
      selectedLocationIds.some(selectedId => 
        loc.displayName.toLowerCase().includes(selectedId.toLowerCase()) ||
        selectedId.toLowerCase().includes(loc.displayName.toLowerCase())
      )
    )
    
    if (locationsByDisplayName.length > 0) {
      console.log(`[gbp-reviews] ✅ FOUND LOCATIONS BY DISPLAY NAME MATCHING:`, locationsByDisplayName.map(l => l.displayName))
      return locationsByDisplayName
    }
    
    return [] // Return empty array if no matches found
  }
  
  // Filter to only selected locations
  const selectedLocations = storedLocations.filter(loc => selectedLocationIds.includes(loc.id))
  console.log(`[gbp-reviews] ✅ FILTERED to ${selectedLocations.length} USER-SELECTED locations:`)
  selectedLocations.forEach(loc => {
    console.log(`[gbp-reviews] - Selected: ${loc.displayName} (${loc.id})`)
  })
  
  if (selectedLocations.length === 0) {
    console.log('[gbp-reviews] ⚠️ SELECTED LOCATIONS NOT FOUND in available locations')
    console.log('[gbp-reviews] This could mean:')
    console.log('[gbp-reviews] 1. Location IDs changed or are invalid')
    console.log('[gbp-reviews] 2. User lost access to previously selected locations')
    console.log('[gbp-reviews] 3. Location selection data is corrupted')
    console.log('[gbp-reviews] User should reconnect GBP and reselect locations')
  }
  
  return selectedLocations
}

/**
 * Fetch GBP locations from Google API with enhanced endpoints
 */
async function fetchGBPLocationsFromAPI(accessToken: string) {
  const locations = []
  
  console.log('[gbp-reviews] fetching locations from Google Business API...')
  
  // Try multiple API endpoints for better location discovery
  const accountEndpoints = [
    'https://mybusinessbusinessinformation.googleapis.com/v1/accounts?pageSize=50',
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=50',
    'https://mybusiness.googleapis.com/v4/accounts'
  ]
  
  let accountsData = null
  
  for (let i = 0; i < accountEndpoints.length; i++) {
    const endpoint = accountEndpoints[i]
    console.log(`[gbp-reviews] trying accounts API endpoint ${i + 1}/${accountEndpoints.length}: ${endpoint}`)
    
    try {
      const accountsResponse = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log(`[gbp-reviews] accounts API endpoint ${i + 1} response status:`, accountsResponse.status)
      
      if (accountsResponse.ok) {
        accountsData = await accountsResponse.json()
        console.log(`[gbp-reviews] accounts API endpoint ${i + 1} success: found ${accountsData.accounts?.length || 0} accounts`)
        break
      } else {
        const errorText = await accountsResponse.text()
        console.log(`[gbp-reviews] accounts API endpoint ${i + 1} failed: ${accountsResponse.status} - ${errorText.substring(0, 200)}`)
      }
    } catch (apiError) {
      console.log(`[gbp-reviews] accounts API endpoint ${i + 1} error:`, apiError.message)
    }
  }
  
  if (!accountsData || !accountsData.accounts) {
    console.log('[gbp-reviews] all accounts API endpoints failed')
    return locations
  }
  
  console.log(`[gbp-reviews] processing ${accountsData.accounts.length} accounts for locations`)
  
  // Get locations from each account
  for (const account of accountsData.accounts || []) {
    try {
      console.log(`[gbp-reviews] fetching locations for account: ${account.name}`)
      
      // Try multiple location API endpoints
      const locationEndpoints = [
        {
          url: `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri&pageSize=50`,
          version: 'business_information_v1'
        },
        {
          url: `https://mybusinessaccountmanagement.googleapis.com/v1/${account.name}/locations?pageSize=50`,
          version: 'account_management_v1'
        },
        {
          url: `https://mybusiness.googleapis.com/v4/${account.name}/locations?pageSize=50`,
          version: 'legacy_v4'
        }
      ]
      
      let accountLocations = null
      
      for (const endpoint of locationEndpoints) {
        console.log(`[gbp-reviews] trying locations API: ${endpoint.version}`)
        
        try {
          const locationsResponse = await fetch(endpoint.url, {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          
          if (locationsResponse.ok) {
            accountLocations = await locationsResponse.json()
            console.log(`[gbp-reviews] locations API ${endpoint.version} success: ${accountLocations.locations?.length || 0} locations`)
            break
          } else {
            const errorText = await locationsResponse.text()
            console.log(`[gbp-reviews] locations API ${endpoint.version} failed: ${locationsResponse.status}`)
          }
        } catch (endpointError) {
          console.log(`[gbp-reviews] locations API ${endpoint.version} error:`, endpointError.message)
        }
      }
      
      if (accountLocations && accountLocations.locations) {
        const enhancedLocations = accountLocations.locations.map(loc => ({
          id: loc.name,
          displayName: loc.title || loc.displayName || loc.name,
          accountName: account.accountName || account.name,
          accountId: account.name.split('/')[1], // Extract numeric account ID
          locationId: loc.name.split('/')[3] // Extract numeric location ID
        }))
        
        locations.push(...enhancedLocations)
        console.log(`[gbp-reviews] added ${enhancedLocations.length} locations from account ${account.name}`)
      }
    } catch (accountError) {
      console.error(`[gbp-reviews] error processing account ${account.name}:`, accountError)
    }
  }
  
  console.log(`[gbp-reviews] total locations found: ${locations.length}`)
  return locations
}

/**
 * Fetch reviews for a specific location using multiple API approaches
 */
async function fetchReviewsForLocation(accessToken: string, location: any) {
  console.log(`[gbp-reviews] === FETCHING REAL REVIEWS for location: ${location.displayName} ===`)
  console.log(`[gbp-reviews] Location ID: ${location.id}`)
  console.log(`[gbp-reviews] Location object:`, location)
  
  // Parse both accounts/{id}/locations/{id} and locations/{id} shapes
  let accountId, locationId
  
  if (location.id && location.id.includes('/')) {
    const parts = location.id.split('/')
    if (parts.length >= 4 && parts[0] === 'accounts' && parts[2] === 'locations') {
      accountId = parts[1]
      locationId = parts[3]
      console.log(`[gbp-reviews] Parsed from full path - accountId: ${accountId}, locationId: ${locationId}`)
    } else if (parts.length >= 2 && parts[0] === 'locations') {
      // Handle locations/{id} format
      locationId = parts[1]
      accountId = location.accountId || null
      console.log(`[gbp-reviews] Parsed from locations path - locationId: ${locationId}, accountId: ${accountId}`)
    } else {
      console.error(`[gbp-reviews] ❌ INVALID location ID format: ${location.id}`)
      return []
    }
  } else {
    // Handle direct numeric IDs
    accountId = location.accountId || location.id
    locationId = location.locationId || location.id
    console.log(`[gbp-reviews] Using direct IDs - accountId: ${accountId}, locationId: ${locationId}`)
  }
  
  // If we still don't have accountId, try to get it from the location object
  if (!accountId && location.accountId) {
    accountId = location.accountId
  }
  
  console.log(`[gbp-reviews] Final extracted IDs - accountId: ${accountId}, locationId: ${locationId}`)
  
  if (!accountId || !locationId) {
    console.error(`[gbp-reviews] ❌ MISSING required IDs - accountId: ${accountId}, locationId: ${locationId}`)
    console.error(`[gbp-reviews] Location object was:`, location)
    return []
  }
  
  console.log(`[gbp-reviews] === CALLING GOOGLE BUSINESS v4 REVIEWS API ===`)
  console.log(`[gbp-reviews] API URL: https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`)
  
  // Use ONLY the v4 API with pagination for reviews (other APIs don't return reviews)
  const allReviews = []
  let pageToken = null
  let pageCount = 0
  const maxPages = 10 // Safety limit
  
  do {
    pageCount++
    console.log(`[gbp-reviews] === FETCHING PAGE ${pageCount} for ${location.displayName} ===`)
    
    const reviewsUrl = new URL(`https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`)
    if (pageToken) {
      reviewsUrl.searchParams.set('pageToken', pageToken)
      console.log(`[gbp-reviews] Using pageToken: ${pageToken}`)
    }
    
    console.log(`[gbp-reviews] Making API call to: ${reviewsUrl.toString()}`)
    
    try {
      const response = await fetch(reviewsUrl.toString(), {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })

      console.log(`[gbp-reviews] API response status: ${response.status}`)
      
      if (response.ok) {
        const reviewsData = await response.json()
        const pageReviews = reviewsData.reviews || []
        
        console.log(`[gbp-reviews] ✅ PAGE ${pageCount} SUCCESS: found ${pageReviews.length} REAL reviews`)
        
        if (pageReviews.length > 0) {
          console.log(`[gbp-reviews] Sample review from API:`, {
            author: pageReviews[0].reviewer?.displayName,
            rating: pageReviews[0].starRating,
            hasComment: !!pageReviews[0].comment,
            createTime: pageReviews[0].createTime,
            reviewName: pageReviews[0].name
          })
        }
        
        if (pageReviews.length > 0) {
          allReviews.push(...pageReviews)
          console.log(`[gbp-reviews] ✅ REAL REVIEWS accumulated: ${allReviews.length}`)
        }
        
        // Check for next page
        pageToken = reviewsData.nextPageToken || null
        
        if (!pageToken) {
          console.log(`[gbp-reviews] ✅ PAGINATION COMPLETE - no more pages`)
          break
        }
      } else {
        const errorText = await response.text()
        console.error(`[gbp-reviews] ❌ v4 API page ${pageCount} FAILED: ${response.status}`)
        console.error(`[gbp-reviews] Error details: ${errorText.substring(0, 500)}`)
        
        if (response.status === 403) {
          console.error(`[gbp-reviews] ❌ PERMISSION DENIED - check OAuth scopes include: https://www.googleapis.com/auth/business.reviews`)
        } else if (response.status === 400) {
          console.error(`[gbp-reviews] ❌ BAD REQUEST - check accountId (${accountId}) and locationId (${locationId}) are valid`)
        }
        break // Stop pagination on error
      }
    } catch (pageError) {
      console.error(`[gbp-reviews] ❌ v4 API page ${pageCount} NETWORK ERROR:`, pageError.message)
      break // Stop pagination on error
    }
  } while (pageToken && pageCount < maxPages)
  
  console.log(`[gbp-reviews] === PAGINATION COMPLETE for ${location.displayName} ===`)
  console.log(`[gbp-reviews] ✅ REAL REVIEWS FETCHED: ${allReviews.length} total reviews from ${pageCount} pages`)
  
  if (allReviews.length > 0) {
    console.log(`[gbp-reviews] ✅ SAMPLE REAL REVIEW:`, {
      author: allReviews[0].reviewer?.displayName,
      rating: allReviews[0].starRating,
      hasText: !!allReviews[0].comment,
      createTime: allReviews[0].createTime,
      commentPreview: allReviews[0].comment?.substring(0, 100) + '...'
    })
  } else {
    console.log(`[gbp-reviews] ⚠️ NO REAL REVIEWS found for ${location.displayName} - this could mean:`)
    console.log(`[gbp-reviews] 1. Location has no reviews`)
    console.log(`[gbp-reviews] 2. API permissions insufficient`)
    console.log(`[gbp-reviews] 3. Account/Location IDs incorrect`)
  }
  
  return allReviews
}

/**
 * Store GBP locations for future use
 */
async function storeGBPLocations(clientId: string, locations: any[]) {
  try {
    // Update integration_accounts metadata
    await supabase
      .from('integration_accounts')
      .update({
        metadata: {
          locations: locations,
          locations_updated_at: new Date().toISOString(),
          locations_source: 'api_fetch'
        },
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('platform', 'gbp')
    
    console.log(`[gbp-reviews] stored ${locations.length} locations in integration metadata`)
  } catch (error) {
    console.log('[gbp-reviews] could not store locations:', error.message)
  }
}

/**
 * Store reviews in database with proper conflict resolution
 */
async function storeReviewsInDatabase(reviews: any[]) {
  console.log(`[gbp-reviews] === STORING ${reviews.length} REAL REVIEWS IN DATABASE ===`)
  
  try {
    // Use upsert to handle duplicates properly
    const { data: upsertedReviews, error: upsertError } = await supabase
      .from('reviews')
      .upsert(reviews, {
        onConflict: 'client_id,external_review_id'
      })
      .select()

    if (upsertError) {
      console.error('[gbp-reviews] ❌ DATABASE UPSERT FAILED:', upsertError.message)
      console.error('[gbp-reviews] Error details:', upsertError)
      throw new Error(`Failed to store reviews: ${upsertError.message}`)
    } else {
      console.log(`[gbp-reviews] ✅ DATABASE SUCCESS: upserted ${upsertedReviews?.length || reviews.length} REAL reviews`)
      console.log(`[gbp-reviews] Sample stored review:`, upsertedReviews?.[0] ? {
        id: upsertedReviews[0].id,
        author: upsertedReviews[0].author_name,
        rating: upsertedReviews[0].rating,
        ai_score: upsertedReviews[0].ai_score,
        platform: upsertedReviews[0].platform
      } : 'No sample available')
      
      return {
        success: true,
        stored: upsertedReviews?.length || reviews.length,
        message: 'Real reviews stored successfully'
      }
    }
  } catch (error) {
    console.error('[gbp-reviews] ❌ DATABASE STORAGE ERROR:', error)
    throw error
  }
}

/**
 * Analyze review with AI
 */
async function analyzeReviewWithAI(reviewText: string, rating: number): Promise<{
  score: number;
  keywords: string[];
  effectiveness: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative';
  reason: string;
}> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    return {
      score: rating * 20,
      keywords: extractBasicKeywords(reviewText),
      effectiveness: rating >= 5 ? 'high' : rating >= 4 ? 'medium' : 'low',
      sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
      reason: 'Basic analysis (AI not configured)'
    }
  }

  try {
    const prompt = `Analyze this dental practice review for marketing effectiveness:

Review: "${reviewText}"
Rating: ${rating}/5 stars

Provide analysis in this exact JSON format:
{
  "score": 85,
  "keywords": ["gentle care", "professional staff", "modern facility"],
  "effectiveness": "high",
  "sentiment": "positive", 
  "reason": "Specific explanation of why this review is effective for marketing"
}

Score 0-100 based on marketing impact, specific details, emotional appeal, and influence potential.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a dental practice marketing expert. Analyze reviews for their marketing effectiveness and provide insights in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Handle both raw JSON and markdown-wrapped JSON from OpenAI
    let cleanResponse = aiResponse.trim()
    
    // More robust markdown code fence removal
    if (cleanResponse.includes('```')) {
      // Find the first { and last } to extract just the JSON
      const firstBrace = cleanResponse.indexOf('{')
      const lastBrace = cleanResponse.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1)
      } else {
        // Fallback: remove all markdown code fences
        cleanResponse = cleanResponse
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/`/g, '')
          .trim()
      }
    }
    
    const analysis = JSON.parse(cleanResponse)
    return analysis

  } catch (error) {
    console.error('[gbp-reviews] AI analysis failed:', error)
    return {
      score: rating * 20,
      keywords: extractBasicKeywords(reviewText),
      effectiveness: rating >= 5 ? 'high' : rating >= 4 ? 'medium' : 'low',
      sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
      reason: `Fallback analysis - ${error.message}`
    }
  }
}

/**
 * Extract basic keywords from review text
 */
function extractBasicKeywords(text: string): string[] {
  const keywords = []
  const lowercaseText = text.toLowerCase()
  
  const keywordPatterns = [
    'gentle', 'professional', 'friendly', 'clean', 'modern', 'comfortable',
    'excellent', 'amazing', 'outstanding', 'thorough', 'painless', 'caring',
    'experienced', 'skilled', 'knowledgeable', 'efficient', 'convenient'
  ]
  
  keywordPatterns.forEach(pattern => {
    if (lowercaseText.includes(pattern)) {
      keywords.push(pattern)
    }
  })
  
  return keywords.slice(0, 5)
}

/**
 * Generate demo reviews for testing
 */
async function generateDemoReviews(clientId: string) {
  const demoReviews = [
    {
      client_id: clientId,
      review_text: 'Dr. Smith and his team are absolutely amazing! I was terrified of dental work, but they made me feel so comfortable. The office is spotless, the staff is incredibly friendly, and the results exceeded my expectations. My teeth have never looked better! I would recommend this practice to anyone looking for exceptional dental care.',
      rating: 5,
      author_name: 'Sarah Johnson',
      review_date: '2024-01-12',
      platform: 'gbp',
      ai_score: 95,
      ai_keywords: JSON.stringify(['comfortable care', 'friendly staff', 'exceptional results', 'exceeded expectations']),
      effectiveness_rating: 'high',
      sentiment: 'positive',
      response_status: 'pending',
      external_review_id: `demo-1-${clientId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      review_text: 'Outstanding service from start to finish. The appointment scheduling was seamless, the facility is modern and clean, and Dr. Smith explained everything clearly. My dental cleaning was thorough and painless. The hygienist was gentle and professional. Highly recommend!',
      rating: 5,
      author_name: 'Mike Thompson',
      review_date: '2024-01-10',
      platform: 'gbp',
      ai_score: 88,
      ai_keywords: JSON.stringify(['seamless scheduling', 'modern facility', 'thorough cleaning', 'professional staff']),
      effectiveness_rating: 'high',
      sentiment: 'positive',
      response_status: 'responded',
      external_review_id: `demo-2-${clientId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      review_text: 'I had a dental emergency and they fit me in the same day. Dr. Smith was so kind and understanding, and fixed my tooth perfectly. The pain relief was immediate. The whole team went above and beyond to help me. Thank you so much!',
      rating: 5,
      author_name: 'Lisa Rodriguez',
      review_date: '2024-01-08',
      platform: 'gbp',
      ai_score: 92,
      ai_keywords: JSON.stringify(['emergency care', 'same day service', 'immediate relief', 'above and beyond']),
      effectiveness_rating: 'high',
      sentiment: 'positive',
      response_status: 'responded',
      external_review_id: `demo-3-${clientId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      review_text: 'The best dental experience I have ever had! Dr. Smith is incredibly skilled and the entire staff makes you feel like family. The office is beautiful and uses the latest technology. I actually look forward to my appointments now!',
      rating: 5,
      author_name: 'Jennifer Davis',
      review_date: '2024-01-05',
      platform: 'gbp',
      ai_score: 94,
      ai_keywords: JSON.stringify(['best experience', 'skilled doctor', 'latest technology', 'feel like family']),
      effectiveness_rating: 'high',
      sentiment: 'positive',
      response_status: 'pending',
      external_review_id: `demo-4-${clientId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: clientId,
      review_text: 'Fantastic dental practice! The hygienist was thorough yet gentle, and Dr. Smith took time to explain my treatment options. The front desk staff is always helpful and accommodating. Five stars!',
      rating: 5,
      author_name: 'Robert Wilson',
      review_date: '2024-01-03',
      platform: 'gbp',
      ai_score: 87,
      ai_keywords: JSON.stringify(['thorough hygienist', 'explained options', 'helpful staff', 'accommodating']),
      effectiveness_rating: 'high',
      sentiment: 'positive',
      response_status: 'pending',
      external_review_id: `demo-5-${clientId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Store demo reviews in database
  try {
    const { error } = await supabase
      .from('reviews')
      .upsert(demoReviews, {
        onConflict: 'client_id,external_review_id'
      })

    if (error) {
      console.log('[gbp-reviews] demo reviews upsert failed, trying insert:', error.message)
      const { error: insertError } = await supabase
        .from('reviews')
        .insert(demoReviews)
      
      if (insertError) {
        console.error('[gbp-reviews] demo reviews insert failed:', insertError.message)
      }
    }
    
    console.log(`[gbp-reviews] stored ${demoReviews.length} demo reviews`)
  } catch (error) {
    console.error('[gbp-reviews] error storing demo reviews:', error)
  }

  return demoReviews
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return { raw: s }; }
}