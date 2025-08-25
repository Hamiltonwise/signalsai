import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const calculateAggregatedPMSMetrics = (metrics: any[]) => {
  if (metrics.length === 0) {
    return {
      totalPatients: 0, // Total referral events
      selfReferred: 0, // Count of self-referred patients
      drReferred: 0, // Count of doctor-referred patients
      totalProduction: 0, // Sum of production_amount
      averageProductionPerPatient: 0, // Average production per referral event
      trend: 'stable',
      changePercent: '0',
      monthlyData: []
    }
  }

  console.log('=== PMS Metrics Calculation Debug ===')
  console.log('Total records to process:', metrics.length)
  console.log('Date range in records:', {
    earliest: metrics[0]?.date,
    latest: metrics[metrics.length - 1]?.date
  })
  console.log('Sample records for debugging:', metrics.slice(0, 3).map(m => ({
    date: m.date,
    referral_type: m.referral_type,
    patient_count: m.patient_count,
    production_amount: m.production_amount
  })));

  // Calculate overall totals from individual referral records
  const totalPatients = metrics.reduce((sum, m) => sum + (m.patient_count || 0), 0); // Sum patient_count (which is 1 per record)
  const selfReferred = metrics.filter(m => m.referral_type === 'self_referral').reduce((sum, m) => sum + (m.patient_count || 0), 0);
  const drReferred = metrics.filter(m => m.referral_type === 'doctor_referral').reduce((sum, m) => sum + (m.patient_count || 0), 0);
  const totalProduction = metrics.reduce((sum, m) => sum + (m.production_amount || 0), 0);

  // Group by month for trend analysis
  const monthlyData = new Map()
  metrics.forEach(metric => {
    const month = metric.date.substring(0, 7) // YYYY-MM
    console.log(`Processing record for month ${month}:`, {
      date: metric.date,
      referral_type: metric.referral_type,
      patient_count: metric.patient_count,
      production_amount: metric.production_amount
    });
    
    if (!monthlyData.has(month)) {
      monthlyData.set(month, {
        month: month,
        selfReferred: 0, // Count of self-referred patients for the month
        drReferred: 0, // Count of doctor-referred patients for the month
        totalPatientsMonth: 0, // Total patients for the month
        production: 0 // Total production for the month
      })
      console.log(`Created new month entry for ${month}`);
    }
    
    const monthData = monthlyData.get(month)
    monthData.totalPatientsMonth += (metric.patient_count || 0); // Sum patient_count for the month
    monthData.production += metric.production_amount || 0;

    if (metric.referral_type === 'self_referral') {
      monthData.selfReferred += (metric.patient_count || 0);
      console.log(`Added self-referral for ${month}: now ${monthData.selfReferred}`);
    } else if (metric.referral_type === 'doctor_referral') {
      monthData.drReferred += (metric.patient_count || 0);
      console.log(`Added doctor-referral for ${month}: now ${monthData.drReferred}`);
    }
    
    console.log(`Month ${month} totals:`, {
      totalPatientsMonth: monthData.totalPatientsMonth,
      selfReferred: monthData.selfReferred,
      drReferred: monthData.drReferred,
      production: monthData.production
    });
  })

  const monthlyArray = Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))

  console.log('=== Monthly Data Aggregation ===')
  console.log('Unique months found:', monthlyArray.length)
  console.log('All months with data:', monthlyArray.map(m => m.month));
  console.log('Monthly breakdown:', monthlyArray.map(m => ({
    month: m.month,
    totalPatients: m.totalPatientsMonth,
    selfReferred: m.selfReferred,
    drReferred: m.drReferred,
    production: m.production
  })))

  // Calculate trend (compare last two months if available)
  let trend = 'stable'
  let changePercent = 0
  
  if (monthlyArray.length >= 2) {
    const lastMonth = monthlyArray[monthlyArray.length - 1]
    const previousMonth = monthlyArray[monthlyArray.length - 2]
    const lastTotal = lastMonth.totalPatientsMonth
    const previousTotal = previousMonth.totalPatientsMonth
    
    console.log('=== Trend Calculation ===')
    console.log('Last month:', lastMonth.month, 'patients:', lastTotal)
    console.log('Previous month:', previousMonth.month, 'patients:', previousTotal)
    
    if (previousTotal > 0) {
      changePercent = ((lastTotal - previousTotal) / previousTotal) * 100
      if (changePercent > 5) trend = 'up'
      else if (changePercent < -5) trend = 'down'
      console.log('Calculated change:', changePercent.toFixed(1) + '%', 'trend:', trend)
    }
  }

  return {
    totalPatients,
    selfReferred,
    drReferred,
    totalProduction,
    averageProductionPerPatient: totalPatients > 0 ? totalProduction / totalPatients : 0,
    trend,
    changePercent: Math.abs(changePercent).toFixed(1),
    monthlyData: monthlyArray
  }
}

Deno.serve(async (req) => {
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

    console.log('=== PMS Metrics Query ===')
    console.log('Query parameters:', { clientId, startDate, endDate })

    const { data: metrics, error } = await supabase
      .from('pms_data')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw new Error(`Failed to retrieve PMS metrics: ${error.message}`)
    }

    console.log('=== PMS Database Query Results ===')
    console.log('Raw database records:', metrics?.length || 0)
    if (metrics && metrics.length > 0) {
      console.log('Sample database record:', metrics[0])
      console.log('Date range in data:', {
        earliest: metrics[0]?.date,
        latest: metrics[metrics.length - 1]?.date
      })
      
      // Log breakdown by referral type
      const selfReferredCount = metrics.filter(m => m.referral_type === 'self_referral').length
      const drReferredCount = metrics.filter(m => m.referral_type === 'doctor_referral').length
      const totalPatientsCount = metrics.reduce((sum, m) => sum + (m.patient_count || 0), 0)
      const totalProductionAmount = metrics.reduce((sum, m) => sum + (m.production_amount || 0), 0)
      
      console.log('=== PMS Data Breakdown ===')
      console.log('Self-referral records:', selfReferredCount)
      console.log('Doctor-referral records:', drReferredCount)
      console.log('Total patients (referral events):', totalPatientsCount)
      console.log('Total production:', totalProductionAmount)
    }

    // Calculate aggregated metrics for the dashboard
    const aggregatedMetrics = calculateAggregatedPMSMetrics(metrics || [])
    
    console.log('=== PMS Aggregated Metrics ===')
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
    console.error('Error retrieving PMS metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})