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

// Enhanced empty field detection function
const isFieldEmpty = (value: any): boolean => {
  return value === null || 
         value === undefined || 
         value === '' || 
         (typeof value === 'string' && value.trim() === '') ||
         value === 'NULL' ||
         value === 'null' ||
         value === 'undefined'
}

Deno.serve(async (req) => {
  const method = req.method;
  
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Always try to get parameters from URL first
    let clientId = url.searchParams.get('clientId')
    let startDate = url.searchParams.get('startDate')
    let endDate = url.searchParams.get('endDate')
    
    // If not found in URL and method is POST, try request body
    if ((!clientId || !startDate || !endDate) && method === 'POST') {
      const body = await req.json()
      clientId = clientId || body.clientId
      startDate = startDate || body.startDate
      endDate = endDate || body.endDate
    }

    if (!clientId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const { data: rawData, error } = await supabase
      .from('pms_data')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      throw new Error(`Failed to retrieve PMS raw data: ${error.message}`)
    }

    if (rawData && rawData.length > 0) {
      // Enhanced field analysis
      const referralSources = rawData.map(r => r.referral_source).filter(source => !isFieldEmpty(source))
      const referralTypes = rawData.map(r => r.referral_type).filter(type => !isFieldEmpty(type))
      const appointmentTypes = rawData.map(r => r.appointment_type).filter(type => !isFieldEmpty(type))
      const treatmentCategories = rawData.map(r => r.treatment_category).filter(cat => !isFieldEmpty(cat))
      
      // Enhanced data quality check using the improved function
      const emptyReferralSources = rawData.filter(r => isFieldEmpty(r.referral_source)).length
      const emptyAppointmentTypes = rawData.filter(r => isFieldEmpty(r.appointment_type)).length
      const emptyTreatmentCategories = rawData.filter(r => isFieldEmpty(r.treatment_category)).length
      
      // Log summary for monitoring
      if (emptyReferralSources > rawData.length * 0.8) {
        console.warn('High percentage of records missing referral_source data');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: rawData || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error retrieving PMS raw data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})