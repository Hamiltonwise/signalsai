import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const calculateAggregatedGBPMetrics = (metrics: any[]) => {
  console.log('=== GBP Metrics Aggregation Debug ===')
  console.log('Input metrics count:', metrics.length)
  
  if (metrics.length === 0) {
    console.log('No metrics to aggregate, returning zeros')
    return {
      totalViews: 0,
      phoneCallsTotal: 0,
      websiteClicksTotal: 0,
      directionRequestsTotal: 0,
      averageRating: 0,
      totalReviews: 0,
      newReviews: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    }
  }

  if (metrics.length > 0) {
    console.log('Sample input metrics (first 3):', metrics.slice(0, 3))
    console.log('Sample input record:', metrics[0])
    console.log('Sample total_reviews value type:', typeof metrics[0]?.total_reviews, 'value:', metrics[0]?.total_reviews)
    console.log('Sample average_rating value type:', typeof metrics[0]?.average_rating, 'value:', metrics[0]?.average_rating)
    
    // Check for all-time vs daily data
    const allTimeReviews = metrics.filter(m => m.total_reviews > 0)
    console.log('Records with reviews data:', allTimeReviews.length, 'out of', metrics.length)
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalViews: acc.totalViews + (metric.total_views || 0),
    phoneCallsTotal: acc.phoneCallsTotal + (metric.phone_calls || 0),
    websiteClicksTotal: acc.websiteClicksTotal + (metric.website_clicks || 0),
    directionRequestsTotal: acc.directionRequestsTotal + (metric.direction_requests || 0),
    totalReviews: Math.max(acc.totalReviews, Number(metric.total_reviews) || 0), // Use max for all-time total
    newReviews: acc.newReviews + (metric.new_reviews || 0),
    ratingSum: acc.ratingSum + (Number(metric.average_rating) || 0),
    ratingCount: acc.ratingCount + (Number(metric.average_rating) > 0 ? 1 : 0),
    calculatedScore: acc.calculatedScore + (Number(metric.calculated_score) || 0)
  }), {
    totalViews: 0,
    phoneCallsTotal: 0,
    websiteClicksTotal: 0,
    directionRequestsTotal: 0,
    totalReviews: 0,
    newReviews: 0,
    ratingSum: 0,
    ratingCount: 0,
    calculatedScore: 0
  })

  const count = metrics.length
  
  console.log('=== GBP Aggregation Analysis ===')
  console.log('Raw totals:', totals)
  console.log('Records with rating data:', totals.ratingCount, 'out of', count)
  
  // CRITICAL FIX: For GBP, use all-time totals, not daily averages
  // total_reviews and average_rating represent all-time values, not daily values
  // They should be the same across all date records for a location
  // ENHANCED: Get the maximum values across all records to ensure we capture all-time totals
  const allTimeReviews = Math.max(...metrics.map(m => parseInt(String(m.total_reviews)) || 0), 0)
  const recordsWithRating = metrics.filter(m => parseFloat(String(m.average_rating)) > 0)
  const allTimeRating = recordsWithRating.length > 0 
    ? recordsWithRating.reduce((sum, m) => sum + parseFloat(String(m.average_rating)), 0) / recordsWithRating.length
    : 0
  
  console.log('✅ GBP ALL-TIME DATA EXTRACTION:', { 
    totalRecords: metrics.length,
    recordsWithRating: recordsWithRating.length, 
    allTimeRating: allTimeRating.toFixed(2), 
    allTimeReviews,
    hasReviewData: allTimeReviews > 0,
    hasRatingData: allTimeRating > 0
  })
  
  // Enhanced validation with specific error detection
  if (allTimeReviews === 0 && allTimeRating === 0 && metrics.length > 0) {
    console.error('❌ GBP ALL-TIME DATA EXTRACTION FAILED')
    console.error('❌ Found database records but no review/rating data extracted')
    console.error('❌ Sample records:', metrics.slice(0, 2).map(m => ({
      date: m.date,
      total_reviews: m.total_reviews,
      average_rating: m.average_rating,
      total_reviews_type: typeof m.total_reviews,
      average_rating_type: typeof m.average_rating
    })))
    console.error('❌ This indicates the gbp-fetch-data function is not storing all-time data correctly')
  }
  
  // Enhanced validation for all-time data
  if (allTimeReviews === 0 && allTimeRating === 0) {
    console.error('❌ GBP AGGREGATION ERROR: No all-time data found in any record')
    console.error('❌ This indicates the fetch-data function is not storing all-time totals correctly')
    console.error('❌ Sample records:', metrics.slice(0, 2).map(m => ({ 
      total_reviews: m.total_reviews, 
      average_rating: m.average_rating,
      date: m.date 
    })))
  } else {
    console.log(`✅ GBP ALL-TIME DATA EXTRACTED: ${allTimeReviews} reviews, ${allTimeRating.toFixed(2)} rating`)
  }
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2)
  const firstHalf = metrics.slice(0, midPoint)
  const secondHalf = metrics.slice(midPoint)
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + (m.total_views || 0), 0) / (firstHalf.length || 1)
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + (m.total_views || 0), 0) / (secondHalf.length || 1)
  
  let trend = 'stable'
  const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0
  
  if (changePercent > 5) trend = 'up'
  else if (changePercent < -5) trend = 'down'

  // CRITICAL: Use all-time totals directly, not averaged across date records
  const averageRating = allTimeRating
  
  const result = {
    totalViews: totals.totalViews,
    phoneCallsTotal: totals.phoneCallsTotal,
    websiteClicksTotal: totals.websiteClicksTotal,
    directionRequestsTotal: totals.directionRequestsTotal,
    averageRating: parseFloat(allTimeRating.toFixed(2)), // All-time rating with proper precision
    totalReviews: allTimeReviews, // All-time total
    newReviews: totals.newReviews,
    calculatedScore: count > 0 ? Math.round(totals.calculatedScore / count) : 0,
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  }
  
  console.log('=== GBP Final Aggregated Result ===')
  console.log('Final aggregated metrics:', result)
  console.log('✅ GBP FINAL VALIDATION: All-time totals -', result.totalReviews, 'reviews,', result.averageRating, 'rating')
  
  // Validate critical metrics
  if (result.totalReviews === 0 && result.averageRating === 0) {
    console.warn('⚠️ GBP METRICS WARNING: Both reviews and rating are 0 - this may indicate data fetching issues')
  }
  
  if (result.totalReviews > 0 && result.averageRating === 0) {
    console.error('⚠️ GBP METRICS ERROR: Reviews exist but rating is 0 - data inconsistency detected')
  }
  
  return result
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== GBP Metrics Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    let clientId, startDate, endDate

    if (req.method === 'GET') {
      // Handle GET request with query parameters
      clientId = url.searchParams.get('clientId')
      startDate = url.searchParams.get('startDate')
      endDate = url.searchParams.get('endDate')
    } else {
      // Handle POST request with JSON body
      const body = await req.json()
      clientId = body.clientId
      startDate = body.startDate
      endDate = body.endDate
    }

    if (!clientId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== GBP Metrics Query ===')
    console.log('Query parameters:', { clientId, startDate, endDate })

    const { data: metrics, error } = await supabase
      .from('gbp_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw new Error(`Failed to retrieve GBP metrics: ${error.message}`)
    }

    console.log('=== GBP Database Query Results ===')
    console.log('Raw database records:', metrics?.length || 0)
    if (metrics && metrics.length > 0) {
      console.log('Sample database record:', metrics[0])
      console.log('Date range in data:', {
        earliest: metrics[0]?.date,
        latest: metrics[metrics.length - 1]?.date
      })
      
      // Log breakdown for debugging
      const totalViews = metrics.reduce((sum, m) => sum + (m.total_views || 0), 0)
      const totalPhoneCalls = metrics.reduce((sum, m) => sum + (m.phone_calls || 0), 0)
      const totalWebsiteClicks = metrics.reduce((sum, m) => sum + (m.website_clicks || 0), 0)
      
      console.log('=== GBP Data Breakdown ===')
      console.log('Total views:', totalViews)
      console.log('Total phone calls:', totalPhoneCalls)
      console.log('Total website clicks:', totalWebsiteClicks)
    }

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedGBPMetrics(metrics || [])
    
    console.log('=== GBP Aggregated Metrics ===')
    console.log('Aggregated result:', aggregatedMetrics)

    return new Response(
      JSON.stringify({
        success: true,
        data: aggregatedMetrics,
        rawData: metrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error retrieving GBP metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})