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

const calculateAggregatedMetrics = (metrics: any[]) => {
  console.log('=== GA4 Metrics Aggregation Debug ===')
  console.log('Input metrics count:', metrics.length)
  console.log('Sample input metrics (first 3):', metrics.slice(0, 3))
  
  if (metrics.length === 0) {
    console.log('No GA4 metrics to aggregate, returning zeros')
    return {
      totalUsers: 0,
      newUsers: 0,
      engagementRate: 0,
      conversions: 0,
      avgSessionDuration: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    }
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalUsers: acc.totalUsers + (Number(metric.total_users) || 0),
    newUsers: acc.newUsers + (Number(metric.new_users) || 0),
    sessions: acc.sessions + (Number(metric.sessions) || 0),
    conversions: acc.conversions + (Number(metric.conversions) || 0),
    engagementRate: acc.engagementRate + (parseFloat(metric.engagement_rate) || 0),
    avgSessionDuration: acc.avgSessionDuration + (parseFloat(metric.avg_session_duration) || 0),
    calculatedScore: acc.calculatedScore + (Number(metric.calculated_score) || 0)
  }), {
    totalUsers: 0,
    newUsers: 0,
    sessions: 0,
    conversions: 0,
    engagementRate: 0,
    avgSessionDuration: 0,
    calculatedScore: 0
  })

  const count = metrics.length
  
  console.log('=== GA4 Aggregation Totals ===')
  console.log('Raw totals before division:', totals)
  console.log('Record count:', count)
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2)
  const firstHalf = metrics.slice(0, midPoint)
  const secondHalf = metrics.slice(midPoint)
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.total_users, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.total_users, 0) / secondHalf.length
  
  let trend = 'stable'
  const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0
  
  if (changePercent > 5) trend = 'up'
  else if (changePercent < -5) trend = 'down'

  const result = {
    totalUsers: totals.totalUsers,
    newUsers: totals.newUsers,
    engagementRate: (totals.engagementRate / count) * 100, // Convert to percentage
    conversions: totals.conversions,
    avgSessionDuration: totals.avgSessionDuration / count,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  }
  
  console.log('=== GA4 Final Aggregated Result ===')
  console.log('Final aggregated metrics:', result)
  
  // Validate critical metrics
  if (result.totalUsers === 0 && result.sessions === 0) {
    console.warn('⚠️ GA4 METRICS WARNING: Both users and sessions are 0 - this may indicate data fetching issues')
  }
  
  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
    } else if (req.method === 'POST') {
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

    const { data: metrics, error } = await supabase
      .from('ga4_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(`Failed to retrieve GA4 metrics: ${error.message}`)
    }

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedMetrics(metrics || [])
    
    return new Response(
      JSON.stringify({
        success: true,
        data: aggregatedMetrics,
        rawData: metrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error retrieving GA4 metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})