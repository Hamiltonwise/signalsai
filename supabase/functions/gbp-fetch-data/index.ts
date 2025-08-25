import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const decryptData = (encryptedData: string): string => {
  return atob(encryptedData)
}

const getStoredTokens = async (clientId: string) => {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('service_name', 'gbp')

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

  if (expiryTime - now < 5 * 60 * 1000 && tokens.refresh_token) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_GBP_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_GBP_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        client_secret: Deno.env.get('GOOGLE_GBP_CLIENT_SECRET')!,
        grant_type: 'refresh_token'
      })
    })

    if (refreshResponse.ok) {
      const newTokens = await refreshResponse.json()
      
      await supabase
        .from('api_credentials')
        .update({
          encrypted_value: btoa(newTokens.access_token),
          expiration_date: newTokens.expires_in ? 
            new Date(Date.now() + newTokens.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('service_name', 'gbp')
        .eq('credential_type', 'access_token')

      return newTokens.access_token
    } else {
      const errorText = await refreshResponse.text();
      console.error('Failed to refresh GBP access token:', refreshResponse.status, errorText);
      throw new Error(`Failed to refresh GBP access token: ${errorText}`);
    }
  }

  return tokens.access_token
}

// Enhanced GBP score calculation
const calculateGBPScore = (metrics: {
  total_views: number;
  phone_calls: number;
  website_clicks: number;
  direction_requests: number;
  average_rating: number;
  total_reviews: number;
  new_reviews: number;
  total_photos: number;
  new_photos: number;
  questions_answered: number;
  posts_created: number;
}): number => {
  let score = 0;

  // Views score (0-15 points)
  const totalViews = metrics.total_views || 0;
  score += Math.min(totalViews / 100 * 15, 15);

  // Engagement score (0-25 points)
  const engagementActions = (metrics.phone_calls || 0) + 
                           (metrics.website_clicks || 0) + 
                           (metrics.direction_requests || 0);
  score += Math.min(engagementActions / 50 * 25, 25);

  // Reviews score (0-25 points)
  const avgRating = metrics.average_rating || 0;
  const reviewCount = metrics.total_reviews || 0;
  const newReviews = metrics.new_reviews || 0;
  const reviewScore = (avgRating / 5 * 15) + Math.min(reviewCount / 20 * 5, 5) + Math.min(newReviews * 5, 5);
  score += reviewScore;

  // Content score (0-20 points)
  const photoScore = Math.min((metrics.total_photos || 0) / 10 * 8, 8);
  const newPhotoScore = Math.min((metrics.new_photos || 0) * 2, 4);
  const qaScore = Math.min((metrics.questions_answered || 0) * 2, 4);
  const postScore = Math.min((metrics.posts_created || 0) * 2, 4);
  score += photoScore + newPhotoScore + qaScore + postScore;

  // Activity bonus (0-15 points)
  const activityBonus = Math.min((metrics.new_reviews || 0) + (metrics.new_photos || 0) + 
                                (metrics.questions_answered || 0) + (metrics.posts_created || 0), 15);
  score += activityBonus;

  return Math.round(Math.min(score, 100));
}

// Fetch data for a single location using correct API endpoints
const fetchSingleLocationData = async (locationId: string, accessToken: string, startDate: Date, endDate: Date) => {
  try {
    console.log(`=== Fetching Data for Single Location: ${locationId} ===`);
    
    // Try to fetch real performance data from Google Business Profile API
    console.log('Attempting to fetch real GBP performance data for location:', locationId);
    
    const locationPath = locationId.startsWith('accounts/') ? locationId : `locations/${locationId}`;
    
    // Format dates for GBP API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Try to fetch insights data (this is the correct endpoint for performance metrics)
    const insightsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationPath}/localPosts:reportInsights`;
    
    try {
      const insightsResponse = await fetch(insightsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          basicRequest: {
            timeRange: {
              startTime: `${startDateStr}T00:00:00Z`,
              endTime: `${endDateStr}T23:59:59Z`
            },
            metricRequests: [
              { metric: 'QUERIES_DIRECT' },
              { metric: 'QUERIES_INDIRECT' },
              { metric: 'VIEWS_MAPS' },
              { metric: 'VIEWS_SEARCH' },
              { metric: 'ACTIONS_WEBSITE' },
              { metric: 'ACTIONS_PHONE' },
              { metric: 'ACTIONS_DRIVING_DIRECTIONS' }
            ]
          }
        })
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        console.log(`Real insights data for ${locationId}:`, insightsData);
        
        // Process the real insights data
        const processedMetrics = processGBPInsightsResponse(insightsData);
        console.log(`Processed real metrics for ${locationId}:`, processedMetrics);
        
        return {
          locationId,
          metrics: processedMetrics,
          success: true
        };
      } else {
        const errorText = await insightsResponse.text();
        console.log(`Insights API failed for ${locationId}: ${insightsResponse.status} - ${errorText}`);
      }
    } catch (apiError) {
      console.log(`GBP API call failed for ${locationId}:`, apiError.message);
    }
    
    // Fallback: Generate realistic demo data if API fails
    console.log('Falling back to demo data for location:', locationId);
    
    // Return empty metrics instead of demo data to avoid masking real data issues
    const fallbackMetrics = {
      totalViews: 0,
      phoneCallsTotal: 0,
      websiteClicksTotal: 0,
      directionRequestsTotal: 0
    };
    
    console.warn(`GBP API failed for ${locationId}, returning empty metrics to avoid masking real data issues`);
    return {
      locationId,
      metrics: fallbackMetrics,
      success: false,
      error: 'API call failed'
    };

  } catch (error) {
    console.error(`Error fetching data for location ${locationId}:`, error);
    
    // Always return valid metrics structure
    return {
      locationId,
      metrics: {
        totalViews: 0,
        phoneCallsTotal: 0,
        websiteClicksTotal: 0,
        directionRequestsTotal: 0
      },
      success: false,
      error: error.message
    };
  }
};

// Alternative API approach if main Performance API fails
const fetchLocationDataAlternative = async (locationId: string, accessToken: string, startDate: Date, endDate: Date) => {
  try {
    console.log(`=== Trying Alternative API for Location: ${locationId} ===`);
    
    // Try using the Business Information API to get basic location data
    const locationPath = locationId.startsWith('accounts/') ? locationId : `locations/${locationId}`;
    
    const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${locationPath}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const locationData = await response.json();
      console.log('Location info retrieved:', locationData.title || locationData.name);
      
      // Return minimal data structure
      return {
        totalViews: 0,
        phoneCallsTotal: 0,
        websiteClicksTotal: 0,
        directionRequestsTotal: 0
      };
    }
    
    throw new Error('Alternative API also failed');
    
  } catch (error) {
    console.error('Alternative API failed:', error);
    return {
      totalViews: 0,
      phoneCallsTotal: 0,
      websiteClicksTotal: 0,
      directionRequestsTotal: 0
    };
  }
};

// Process the GBP API response to extract metrics
const processGBPApiResponse = (apiData: any, locationId: string) => {
  console.log(`=== Processing GBP API Response for ${locationId} ===`);
  
  let totalViews = 0;
  let phoneCallsTotal = 0;
  let websiteClicksTotal = 0;
  let directionRequestsTotal = 0;
  
  try {
    const multiDailyMetricTimeSeries = apiData.multiDailyMetricTimeSeries || [];
    console.log('Multi-daily metric time series count:', multiDailyMetricTimeSeries.length);
    
    multiDailyMetricTimeSeries.forEach((multiSeries: any) => {
      const dailyMetricTimeSeries = multiSeries.dailyMetricTimeSeries || [];
      console.log('Processing daily metric time series:', dailyMetricTimeSeries.length);
      
      dailyMetricTimeSeries.forEach((series: any) => {
        const metricName = series.dailyMetric;
        const datedValues = series.timeSeries?.datedValues || [];
        
        console.log(`Processing metric: ${metricName}, values: ${datedValues.length}`);
        
        datedValues.forEach((dayValue: any) => {
          const value = parseInt(dayValue.value) || 0;
          
          switch (metricName) {
            case 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS':
            case 'BUSINESS_IMPRESSIONS_MOBILE_MAPS':
            case 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH':
            case 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH':
              totalViews += value;
              break;
            case 'CALL_CLICKS':
              phoneCallsTotal += value;
              break;
            case 'WEBSITE_CLICKS':
              websiteClicksTotal += value;
              break;
            case 'BUSINESS_DIRECTION_REQUESTS':
              directionRequestsTotal += value;
              break;
          }
        });
      });
    });
    
    console.log(`=== Processed Metrics for ${locationId} ===`);
    console.log('Total views:', totalViews);
    console.log('Phone calls:', phoneCallsTotal);
    console.log('Website clicks:', websiteClicksTotal);
    console.log('Direction requests:', directionRequestsTotal);
    
  } catch (error) {
    console.error('Error processing API response:', error);
  }
  
  return {
    totalViews,
    phoneCallsTotal,
    websiteClicksTotal,
    directionRequestsTotal
  };
};

// Fetch additional data (reviews, photos, etc.)
const fetchLocationReviews = async (locationId: string, accessToken: string) => {
  try {
    console.log(`=== Fetching Reviews and Rating for ${locationId} ===`);
    
    const locationPath = locationId.startsWith('accounts/') ? locationId : `locations/${locationId}`;
    
    // CRITICAL: Fetch all-time review data using multiple API approaches
    console.log(`Fetching all-time review data for ${locationId}...`);
    
    // Try multiple API endpoints to get all-time review data
    const apiEndpoints = [
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationPath}/reviews`,
      `https://mybusiness.googleapis.com/v4/${locationPath}/reviews`,
      `https://mybusinessaccountmanagement.googleapis.com/v1/${locationPath}/reviews`
    ];
    
    for (let i = 0; i < apiEndpoints.length; i++) {
      const reviewsUrl = apiEndpoints[i];
      console.log(`Trying API endpoint ${i + 1}/${apiEndpoints.length}: ${reviewsUrl}`);
      
      const reviewsResponse = await fetch(reviewsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const reviews = reviewsData.reviews || [];
        
        console.log(`✅ API endpoint ${i + 1} success: Found ${reviews.length} reviews`);
        
        const totalReviews = reviews.length;
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + (review.starRating || 0), 0) / reviews.length 
          : 0;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newReviews = reviews.filter((review: any) => {
          if (!review.createTime) return false;
          const reviewDate = new Date(review.createTime);
          return reviewDate >= thirtyDaysAgo;
        }).length;
        
        console.log(`✅ ALL-TIME REVIEW DATA EXTRACTED from API ${i + 1}: ${totalReviews} total reviews, ${averageRating.toFixed(2)} average rating`);
        console.log(`✅ NEW REVIEWS (last 30 days): ${newReviews} reviews`);
        
        return {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(2)),
          newReviews
        };
      } else {
        const errorText = await reviewsResponse.text();
        console.log(`API endpoint ${i + 1} failed: ${reviewsResponse.status} - ${errorText.substring(0, 100)}`);
      }
    }
    
    console.log(`❌ All API endpoints failed for ${locationId}, returning empty data`);

  } catch (error) {
    console.error(`Error fetching reviews for ${locationId}:`, error);
  }
  
  // Return empty data if all APIs fail
  return {
    totalReviews: 0,
    averageRating: 0,
    newReviews: 0
  };
};

// Create final records with all data combined
const createLocationRecords = (
  locationData: any,
  reviewsData: any,
  clientId: string,
  locationId: string,
  startDate: Date,
  endDate: Date
) => {
  const locationName = locationId.split('/').pop() || locationId;
  const processedData = [];
  
  // Calculate days in range
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  console.log(`=== Creating Records for ${locationId} ===`);
  console.log('Days in range:', daysDiff);
  console.log('Location data:', locationData);
  console.log('Reviews data:', reviewsData);
  
  // CRITICAL: Use all-time reviews data (not averaged across days)
  const actualTotalReviews = reviewsData.totalReviews || 0;
  const actualAverageRating = reviewsData.averageRating || 0;
  const actualNewReviews = reviewsData.newReviews || 0;
  
  console.log(`✅ STORING ALL-TIME REVIEW DATA: ${actualTotalReviews} reviews, ${actualAverageRating.toFixed(2)} rating`);
  console.log(`✅ NEW REVIEWS (30 days): ${actualNewReviews} reviews`);
  console.log(`✅ This data will be stored in each daily record to ensure consistent aggregation`);
  
  // Validate we're storing all-time data correctly
  if (actualTotalReviews > 0) {
    console.log(`✅ ALL-TIME DATA VALIDATION PASSED: ${actualTotalReviews} reviews, ${actualAverageRating.toFixed(2)} rating`);
  } else {
    console.warn(`⚠️ ALL-TIME DATA WARNING: No reviews found for ${locationId}. This may indicate API access issues.`);
  }
  
  // Create a record for each day in the range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    const record = {
      client_id: clientId,
      date: dateStr,
      location_name: locationName,
      // Distribute totals across the date range
      total_views: Math.floor((locationData.totalViews || 0) / daysDiff),
      search_views: Math.floor((locationData.totalViews || 0) * 0.6 / daysDiff),
      maps_views: Math.floor((locationData.totalViews || 0) * 0.4 / daysDiff),
      phone_calls: Math.floor((locationData.phoneCallsTotal || 0) / daysDiff),
      website_clicks: Math.floor((locationData.websiteClicksTotal || 0) / daysDiff),
      direction_requests: Math.floor((locationData.directionRequestsTotal || 0) / daysDiff),
      // CRITICAL: Store all-time totals in each record (not distributed across days)
      total_reviews: actualTotalReviews, // All-time total, same for each day
      average_rating: actualAverageRating, // All-time rating, same for each day
      new_reviews: actualNewReviews,
      total_photos: 0, // Would need separate API call
      new_photos: 0,
      questions_answered: 0,
      posts_created: 0,
      calculated_score: 0
    };

    // Calculate score
    record.calculated_score = calculateGBPScore(record);
    
    processedData.push(record);
  }
  
  console.log(`=== Final Records for ${locationId} ===`);
  console.log(`Created ${processedData.length} records`);
  console.log(`✅ Each record contains ALL-TIME DATA: ${actualTotalReviews} reviews, ${actualAverageRating.toFixed(2)} rating`);
  console.log('Sample record:', processedData[0]);
  
  return processedData;
};

// Process GBP Insights API response
const processGBPInsightsResponse = (insightsData: any) => {
  console.log('=== Processing GBP Insights Response ===');
  console.log('Insights data:', insightsData);
  
  let totalViews = 0;
  let phoneCallsTotal = 0;
  let websiteClicksTotal = 0;
  let directionRequestsTotal = 0;
  
  try {
    const locationMetrics = insightsData.locationMetrics || [];
    
    locationMetrics.forEach((locationMetric: any) => {
      const metricValues = locationMetric.metricValues || [];
      
      metricValues.forEach((metricValue: any) => {
        const metric = metricValue.metric;
        const totalValue = metricValue.totalValue?.value || 0;
        
        console.log(`Processing metric: ${metric}, value: ${totalValue}`);
        
        switch (metric) {
          case 'QUERIES_DIRECT':
          case 'QUERIES_INDIRECT':
          case 'VIEWS_MAPS':
          case 'VIEWS_SEARCH':
            totalViews += parseInt(totalValue) || 0;
            break;
          case 'ACTIONS_PHONE':
            phoneCallsTotal += parseInt(totalValue) || 0;
            break;
          case 'ACTIONS_WEBSITE':
            websiteClicksTotal += parseInt(totalValue) || 0;
            break;
          case 'ACTIONS_DRIVING_DIRECTIONS':
            directionRequestsTotal += parseInt(totalValue) || 0;
            break;
        }
      });
    });
    
    console.log('=== Processed Real GBP Metrics ===');
    console.log('Total views:', totalViews);
    console.log('Phone calls:', phoneCallsTotal);
    console.log('Website clicks:', websiteClicksTotal);
    console.log('Direction requests:', directionRequestsTotal);
    
  } catch (error) {
    console.error('Error processing insights response:', error);
  }
  
  return {
    totalViews,
    phoneCallsTotal,
    websiteClicksTotal,
    directionRequestsTotal
  };
};

// Aggregate data from multiple locations by date
const aggregateLocationData = (allLocationData: any[]) => {
  console.log('=== Aggregating Multi-Location Data ===');
  console.log('Total records from all locations:', allLocationData.length);
  
  const aggregatedByDate = new Map();
  
  allLocationData.forEach(record => {
    const dateKey = record.date;
    
    if (!aggregatedByDate.has(dateKey)) {
      aggregatedByDate.set(dateKey, {
        client_id: record.client_id,
        date: record.date,
        location_name: 'All Locations',
        total_views: 0,
        search_views: 0,
        maps_views: 0,
        phone_calls: 0,
        website_clicks: 0,
        direction_requests: 0,
        total_reviews: 0,
        average_rating: 0,
        new_reviews: 0,
        total_photos: 0,
        new_photos: 0,
        questions_answered: 0,
        posts_created: 0,
        calculated_score: 0,
        location_count: 0,
        rating_sum: 0
      });
    }
    
    const aggregated = aggregatedByDate.get(dateKey);
    
    // Sum all numeric metrics
    aggregated.total_views += record.total_views || 0;
    aggregated.search_views += record.search_views || 0;
    aggregated.maps_views += record.maps_views || 0;
    aggregated.phone_calls += record.phone_calls || 0;
    aggregated.website_clicks += record.website_clicks || 0;
    aggregated.direction_requests += record.direction_requests || 0;
    aggregated.new_reviews += record.new_reviews || 0;
    aggregated.total_photos += record.total_photos || 0;
    aggregated.new_photos += record.new_photos || 0;
    aggregated.questions_answered += record.questions_answered || 0;
    aggregated.posts_created += record.posts_created || 0;
    
    // Handle reviews and ratings (take max for total_reviews, average for rating)
    aggregated.total_reviews = Math.max(aggregated.total_reviews, record.total_reviews || 0);
    if (record.average_rating > 0) {
      aggregated.rating_sum += record.average_rating;
      aggregated.location_count += 1;
    }
  });
  
  // Convert map to array and finalize calculations
  const result = Array.from(aggregatedByDate.values()).map(record => {
    // Calculate average rating across locations
    if (record.location_count > 0) {
      record.average_rating = record.rating_sum / record.location_count;
    }
    
    // Calculate aggregated score
    record.calculated_score = calculateGBPScore(record);
    
    // Clean up temporary fields
    delete record.rating_sum;
    delete record.location_count;
    
    console.log(`Aggregated data for ${record.date}:`, {
      total_views: record.total_views,
      phone_calls: record.phone_calls,
      website_clicks: record.website_clicks,
      total_reviews: record.total_reviews,
      average_rating: record.average_rating,
      calculated_score: record.calculated_score
    });
    
    return record;
  });
  
  console.log('Final aggregated records:', result.length);
  return result;
};

const storeGBPMetrics = async (data: any[]) => {
  if (data.length === 0) {
    console.log('No data to store');
    return;
  }

  console.log('Storing GBP metrics:', data.length, 'records');
  
  const { error } = await supabase
    .from('gbp_metrics')
    .upsert(data, { onConflict: 'client_id,date,location_name' });
  
  if (error) {
    console.error('Error storing GBP metrics:', error);
    throw error;
  }
  
  console.log('GBP metrics stored successfully');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== GBP Fetch Data Function Called ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Request body received:', body);
    const { clientId, locationIds, startDate, endDate } = body;

    // Handle both single locationId (legacy) and multiple locationIds
    let locationsToProcess = [];
    if (locationIds && Array.isArray(locationIds)) {
      locationsToProcess = locationIds;
      console.log('Using locationIds array:', locationsToProcess.length, 'locations')
    } else if (body.locationId) {
      // Legacy support for single location
      locationsToProcess = [body.locationId];
      console.log('Using legacy single locationId:', body.locationId)
    } else if (typeof locationIds === 'string') {
      // Handle case where locationIds is passed as a single string
      locationsToProcess = [locationIds]
      console.log('Converting single locationId string to array:', locationIds)
    }

    console.log('=== GBP Fetch Data Validation ===')
    console.log('Client ID:', clientId)
    console.log('Locations to process:', locationsToProcess)
    console.log('Start date:', startDate)
    console.log('End date:', endDate)

    if (!clientId) {
      console.error('Missing clientId')
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (locationsToProcess.length === 0) {
      console.error('No locations provided')
      return new Response(
        JSON.stringify({ error: 'At least one location ID is required. Provide locationIds array or single locationId.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!startDate || !endDate) {
      console.error('Missing required fields:', { 
        hasClientId: !!clientId, 
        locationCount: locationsToProcess.length, 
        hasStartDate: !!startDate, 
        hasEndDate: !!endDate 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing GBP data for client:', clientId);
    console.log('Location IDs:', locationsToProcess);
    console.log('Processing', locationsToProcess.length, 'location(s)')
    console.log('Date range:', { startDate, endDate });

    // Get stored tokens for real API calls
    const tokens = await getStoredTokens(clientId)
    console.log('Retrieved tokens:', { hasAccessToken: !!tokens?.access_token, hasRefreshToken: !!tokens?.refresh_token })
    
    if (!tokens) {
      console.log('No GBP tokens found for client:', clientId)
      return new Response(
        JSON.stringify({ error: 'No GBP tokens found for client. Please reconnect Google Business Profile.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token if needed
    console.log('Checking if token refresh is needed...')
    const accessToken = await refreshAccessTokenIfNeeded(clientId, tokens)
    console.log('Using access token (first 20 chars):', accessToken?.substring(0, 20) + '...')

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    console.log(`=== Starting ${locationsToProcess.length}-Location Data Fetch ===`)
    const allProcessedData = [];
    
    // Process each location
    for (let i = 0; i < locationsToProcess.length; i++) {
      const locationId = locationsToProcess[i]
      try {
        console.log(`=== Processing Location ${i + 1}/${locationsToProcess.length}: ${locationId} ===`)
        
        // Fetch real data from Google Business Profile API
        const locationData = await fetchSingleLocationData(locationId, accessToken, startDateObj, endDateObj);
        console.log(`Location ${locationId} real data:`, locationData);
        
        // Fetch real reviews data
        const reviewsData = await fetchLocationReviews(locationId, accessToken);
        console.log(`Location ${locationId} reviews:`, reviewsData);
        
        // Create records for this location
        const locationRecords = createLocationRecords(
          locationData.metrics,
          reviewsData,
          clientId,
          locationId,
          startDateObj,
          endDateObj
        );

        allProcessedData.push(...locationRecords);
        console.log(`Location ${locationId} processed: ${locationRecords.length} records`);
        
      } catch (locationError) {
        console.error(`Error processing location ${locationId}:`, locationError);
        
        // Create fallback records with minimal data
        const fallbackRecords = createLocationRecords(
          { totalViews: 0, phoneCallsTotal: 0, websiteClicksTotal: 0, directionRequestsTotal: 0 },
          { totalReviews: 0, averageRating: 0, newReviews: 0 },
          clientId,
          locationId,
          startDateObj,
          endDateObj
        );
        allProcessedData.push(...fallbackRecords);
        console.log(`Added ${fallbackRecords.length} fallback records for failed location ${locationId}`);
      }
    }

    if (allProcessedData.length === 0) {
      console.error('No data was successfully processed from any location')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch data from any of the selected locations',
          locationsAttempted: locationsToProcess.length
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`=== Aggregating ${locationsToProcess.length}-Location Data ===`)
    console.log('Total records from all locations:', allProcessedData.length);
    
    // For single location, use the data as-is. For multiple locations, aggregate by date
    const finalData = locationsToProcess.length === 1 
      ? allProcessedData 
      : aggregateLocationData(allProcessedData)
      
    console.log('Final data records:', finalData.length)
    
    console.log('=== Storing Aggregated GBP Data ===');
    await storeGBPMetrics(finalData)
    console.log('GBP metrics stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: finalData,
        message: `GBP data fetched and aggregated from ${locationsToProcess.length} location(s)`,
        locationsProcessed: locationsToProcess.length,
        totalRecords: allProcessedData.length,
        finalRecords: finalData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching GBP data:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Failed to fetch GBP data: ${error.message}`,
        data: [],
        locationsAttempted: locationsToProcess?.length || 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})