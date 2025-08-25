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

// HOISTED: Safe number parsing function - defined at top level to avoid TDZ issues
export function safeParseNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/,/g, '').replace(/%$/, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const n = Number(value as any);
  return Number.isFinite(n) ? n : fallback;
}

const calculateAggregatedGSCMetrics = (metrics: any[]) => {
  console.log('=== GSC Aggregation Function Debug ===')
  console.log('Input metrics count:', metrics.length)
  
  if (metrics.length > 0) {
    console.log('=== GSC Raw Data Analysis ===')
    console.log('Sample input record (full):', JSON.stringify(metrics[0], null, 2))
    
    // Enhanced type analysis for debugging
    const sample = metrics[0]
    console.log('Field analysis:', {
      clicks: { type: typeof sample?.clicks, value: sample?.clicks, isNull: sample?.clicks === null, isUndefined: sample?.clicks === undefined },
      impressions: { type: typeof sample?.impressions, value: sample?.impressions, isNull: sample?.impressions === null, isUndefined: sample?.impressions === undefined },
      ctr: { type: typeof sample?.ctr, value: sample?.ctr, isNull: sample?.ctr === null, isUndefined: sample?.ctr === undefined },
      position: { type: typeof sample?.position, value: sample?.position, isNull: sample?.position === null, isUndefined: sample?.position === undefined }
    })
    
    // Test different parsing approaches using the hoisted function
    console.log('Parsing test results:', {
      clicksNumber: Number(sample?.clicks),
      clicksParseInt: parseInt(String(sample?.clicks)),
      clicksParseFloat: parseFloat(String(sample?.clicks)),
      clicksUnaryPlus: +(sample?.clicks || 0),
      clicksIsNaN: isNaN(Number(sample?.clicks)),
      clicksSafeParse: safeParseNumber(sample?.clicks)
    })
  }
  
  if (metrics.length === 0) {
    console.log('No metrics to aggregate, returning zeros')
    return {
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      averagePosition: 0,
      totalQueries: 0,
      calculatedScore: 0,
      trend: 'stable',
      changePercent: '0'
    }
  }

  console.log('=== Processing All Records ===')
  metrics.slice(0, 3).forEach((metric, index) => {
    console.log(`Record ${index + 1} detailed analysis:`, {
      rawRecord: metric,
      clicks: {
        raw: metric.clicks,
        type: typeof metric.clicks,
        stringified: String(metric.clicks),
        numberConverted: Number(metric.clicks),
        isValidNumber: !isNaN(Number(metric.clicks)),
        finalValue: safeParseNumber(metric.clicks)
      },
      impressions: {
        raw: metric.impressions,
        type: typeof metric.impressions,
        stringified: String(metric.impressions),
        numberConverted: Number(metric.impressions),
        isValidNumber: !isNaN(Number(metric.impressions)),
        finalValue: safeParseNumber(metric.impressions)
      }
    })
  })
  
  // CRITICAL FIX: Use direct number conversion with proper null handling
  const totals = metrics.reduce((acc, metric) => ({
    totalImpressions: acc.totalImpressions + (Number(metric.impressions) || 0),
    totalClicks: acc.totalClicks + (Number(metric.clicks) || 0),
    ctrSum: acc.ctrSum + (Number(metric.ctr) || 0),
    positionSum: acc.positionSum + (Number(metric.position) || 0),
    calculatedScore: acc.calculatedScore + (Number(metric.calculated_score) || 0)
  }), {
    totalImpressions: 0,
    totalClicks: 0,
    ctrSum: 0,
    positionSum: 0,
    calculatedScore: 0
  })

  console.log('=== GSC Aggregation Totals ===')
  console.log('Raw totals before division:', totals)
  console.log('Aggregation validation:', {
    totalClicksIsZero: totals.totalClicks === 0,
    totalImpressionsIsZero: totals.totalImpressions === 0,
    hasValidData: totals.totalClicks > 0 || totals.totalImpressions > 0
  })
  
  // CRITICAL: If aggregation still fails, perform emergency manual calculation
  if (totals.totalClicks === 0 && metrics.length > 0) {
    console.error('❌ PRIMARY AGGREGATION FAILED - Attempting emergency manual calculation')
    
    let emergencyClicks = 0
    let emergencyImpressions = 0
    
    for (let i = 0; i < metrics.length; i++) {
      const record = metrics[i]
      console.log(`Emergency parsing record ${i + 1}:`, {
        rawClicks: record.clicks,
        rawImpressions: record.impressions,
        clicksType: typeof record.clicks,
        impressionsType: typeof record.impressions
      })
      
      // Direct number conversion for emergency parsing
      const clicksValue = Number(record.clicks) || 0
      const impressionsValue = Number(record.impressions) || 0
      
      console.log(`Emergency result for record ${i + 1}:`, {
        clicksValue,
        impressionsValue
      })
      
      emergencyClicks += clicksValue
      emergencyImpressions += impressionsValue
    }
    
    console.log('=== EMERGENCY AGGREGATION RESULTS ===')
    console.log('Emergency clicks total:', emergencyClicks)
    console.log('Emergency impressions total:', emergencyImpressions)
    
    if (emergencyClicks > 0) {
      console.log('✅ EMERGENCY AGGREGATION SUCCESSFUL - Using emergency totals')
      totals.totalClicks = emergencyClicks
      totals.totalImpressions = emergencyImpressions
    } else {
      console.error('❌ EMERGENCY AGGREGATION ALSO FAILED - Data may be corrupted')
    }
  }
  
  const count = metrics.length
  const uniqueQueries = new Set(metrics.map(m => m.query).filter(Boolean)).size
  
  // Calculate trend (compare first half vs second half of period)
  const midPoint = Math.floor(count / 2)
  const firstHalf = metrics.slice(0, midPoint)
  const secondHalf = metrics.slice(midPoint)
  
  const firstHalfClicks = firstHalf.reduce((sum, m) => sum + (Number(m.clicks) || 0), 0)
  const secondHalfClicks = secondHalf.reduce((sum, m) => sum + (Number(m.clicks) || 0), 0)
  
  let trend = 'stable'
  const changePercent = firstHalfClicks > 0 ? ((secondHalfClicks - firstHalfClicks) / firstHalfClicks) * 100 : 0
  
  if (changePercent > 5) trend = 'up'
  else if (changePercent < -5) trend = 'down'

  const result = {
    totalImpressions: totals.totalImpressions,
    totalClicks: totals.totalClicks,
    averageCTR: count > 0 ? (totals.ctrSum / count) * 100 : 0, // Convert to percentage, handle division by zero
    averagePosition: count > 0 ? totals.positionSum / count : 0,
    totalQueries: uniqueQueries,
    calculatedScore: count > 0 ? Math.round(totals.calculatedScore / count) : 0,
    trend,
    changePercent: Math.abs(changePercent).toFixed(1)
  }
  
  console.log('=== GSC Final Aggregated Result ===')
  console.log('Final aggregated metrics:', result)
  console.log('Clicks check - should not be 0 if raw data has clicks:', result.totalClicks)
  
  // Enhanced validation with specific error detection
  if (result.totalClicks === 0 && result.totalImpressions > 0) {
    console.error('❌ GSC AGGREGATION ERROR: Clicks are 0 but impressions exist')
    console.error('❌ This indicates a parsing issue in the aggregation function')
    console.error('❌ Raw data sample:', metrics.slice(0, 2).map(m => ({ clicks: m.clicks, impressions: m.impressions })))
  } else if (result.totalClicks > 0) {
    console.log('✅ GSC AGGREGATION SUCCESS: Clicks properly aggregated:', result.totalClicks)
  }
  
  // Validate critical metrics
  if (result.totalClicks === 0 && result.totalImpressions > 0) {
    console.warn('⚠️ GSC METRICS WARNING: Impressions exist but clicks are 0 - check CTR calculation')
  }
  
  if (result.totalImpressions === 0) {
    console.warn('⚠️ GSC METRICS WARNING: No impressions found - this may indicate data fetching issues')
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
      .from('gsc_metrics')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(`Failed to retrieve GSC metrics: ${error.message}`)
    }

    console.log('=== GSC Database Query Results ===')
    console.log('Query parameters:', { clientId, startDate, endDate })
    console.log('Raw database records:', metrics?.length || 0)
    if (metrics && metrics.length > 0) {
      console.log('Sample database record:', metrics[0])
      console.log('Date range in data:', {
        earliest: metrics[0]?.date,
        latest: metrics[metrics.length - 1]?.date
      })
      
      // Log aggregation details for transparency
      const totalImpressions = metrics.reduce((sum, m) => sum + safeParseNumber(m.impressions), 0)
      const totalClicks = metrics.reduce((sum, m) => sum + safeParseNumber(m.clicks), 0)
      const uniqueQueries = new Set(metrics.map(m => m.query).filter(Boolean)).size
      const uniquePages = new Set(metrics.map(m => m.page).filter(Boolean)).size
      
      console.log('=== GSC Data Breakdown ===')
      console.log('Total raw impressions (sum of all records):', totalImpressions)
      console.log('Total raw clicks (sum of all records):', totalClicks)
      console.log('Unique queries in data:', uniqueQueries)
      console.log('Unique pages in data:', uniquePages)
      console.log('Records per day average:', (metrics.length / Math.max(1, new Set(metrics.map(m => m.date)).size)).toFixed(1))
      
      // Show sample queries and pages for context
      const sampleQueries = [...new Set(metrics.map(m => m.query).filter(Boolean))].slice(0, 5)
      const samplePages = [...new Set(metrics.map(m => m.page).filter(Boolean))].slice(0, 3)
      console.log('Sample queries:', sampleQueries)
      console.log('Sample pages:', samplePages)
    }

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedGSCMetrics(metrics || [])
    
    console.log('=== GSC Aggregated Metrics ===')
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
    console.error('Error retrieving GSC metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})