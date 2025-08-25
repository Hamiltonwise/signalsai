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

const calculateAggregatedClarityMetrics = (metrics: any[]) => {
  if (metrics.length === 0) {
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      pageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      deadClicks: 0,
      rageClicks: 0,
      quickBacks: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    }
  }

  const totals = metrics.reduce((acc, metric) => ({
    totalSessions: acc.totalSessions + (metric.total_sessions || 0),
    uniqueUsers: acc.uniqueUsers + (metric.unique_users || 0),
    pageViews: acc.pageViews + (metric.page_views || 0),
    avgSessionDuration: acc.avgSessionDuration + (metric.avg_session_duration || 0),
    bounceRate: acc.bounceRate + (metric.bounce_rate || 0),
    deadClicks: acc.deadClicks + (metric.dead_clicks || 0),
    rageClicks: acc.rageClicks + (metric.rage_clicks || 0),
    quickBacks: acc.quickBacks + (metric.quick_backs || 0),
    calculatedScore: acc.calculatedScore + (metric.calculated_score || 0)
  }), {
    totalSessions: 0,
    uniqueUsers: 0,
    pageViews: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    deadClicks: 0,
    rageClicks: 0,
    quickBacks: 0,
    calculatedScore: 0
  })

  const count = metrics.length
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2)
  const firstHalf = metrics.slice(0, midPoint)
  const secondHalf = metrics.slice(midPoint)
  
  const firstHalfSessions = firstHalf.reduce((sum, m) => sum + (m.total_sessions || 0), 0)
  const secondHalfSessions = secondHalf.reduce((sum, m) => sum + (m.total_sessions || 0), 0)
  
  let trend = 'stable'
  const changePercent = firstHalfSessions > 0 ? ((secondHalfSessions - firstHalfSessions) / firstHalfSessions) * 100 : 0
  
  if (changePercent > 5) trend = 'up'
  else if (changePercent < -5) trend = 'down'

  return {
    totalSessions: totals.totalSessions,
    uniqueUsers: totals.uniqueUsers,
    pageViews: totals.pageViews,
    avgSessionDuration: totals.avgSessionDuration / count,
    bounceRate: (totals.bounceRate / count) * 100, // Convert to percentage
    deadClicks: totals.deadClicks,
    rageClicks: totals.rageClicks,
    quickBacks: totals.quickBacks,
    calculatedScore: Math.round(totals.calculatedScore / count),
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  }
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

    console.log('=== Clarity Metrics Query ===')
    console.log('Query parameters:', { clientId, startDate, endDate })

    const { data: metrics, error } = await supabase
      .from('clarity_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw new Error(`Failed to retrieve Clarity metrics: ${error.message}`)
    }

    console.log('=== Clarity Database Query Results ===')
    console.log('Raw database records:', metrics?.length || 0)
    if (metrics && metrics.length > 0) {
      console.log('Sample database record:', metrics[0])
      console.log('Date range in data:', {
        earliest: metrics[0]?.date,
        latest: metrics[metrics.length - 1]?.date
      })
      
      // Log breakdown for debugging
      const totalSessions = metrics.reduce((sum, m) => sum + (m.total_sessions || 0), 0)
      const totalDeadClicks = metrics.reduce((sum, m) => sum + (m.dead_clicks || 0), 0)
      const totalRageClicks = metrics.reduce((sum, m) => sum + (m.rage_clicks || 0), 0)
      
      console.log('=== Clarity Data Breakdown ===')
      console.log('Total sessions:', totalSessions)
      console.log('Total dead clicks:', totalDeadClicks)
      console.log('Total rage clicks:', totalRageClicks)
    }

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedClarityMetrics(metrics || [])
    
    console.log('=== Clarity Aggregated Metrics ===')
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
    console.error('Error retrieving Clarity metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})