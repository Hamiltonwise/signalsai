import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Add immediate console log at the top level to verify function loads
console.log('=== VERIFY-PMS-DATA FUNCTION LOADED ===', new Date().toISOString())

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Test database connection immediately
console.log('Supabase environment check:', {
  hasUrl: !!Deno.env.get('SUPABASE_URL'),
  hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  url: Deno.env.get('SUPABASE_URL')?.substring(0, 30) + '...'
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

console.log('Supabase client created successfully')

serve(async (req) => {
  console.log('=== FUNCTION INVOKED ===', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Database Verification Function Called ===')
  
  try {
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId')
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying data for client:', clientId)
    console.log('Supabase client initialized:', !!supabase)

    // 1. Check total record count
    const { count: totalCount, error: countError } = await supabase
      .from('pms_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (countError) {
      console.error('=== COUNT QUERY ERROR ===')
      console.error('Error details:', countError)
      throw new Error(`Count query failed: ${countError.message}`)
    } else {
      console.log('=== TOTAL RECORD COUNT ===', totalCount)
    }

    // 2. Get recent records with all fields
    const { data: recentData, error: recentError } = await supabase
      .from('pms_data')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('=== RECENT DATA QUERY ERROR ===')
      console.error('Error details:', recentError)
      console.error('Error message:', recentError.message)
      throw new Error(`Failed to fetch recent data: ${recentError.message}`)
    }

    // 3. Analyze category field presence
    const categoryAnalysis = {
      total_records: recentData?.length || 0,
      records_with_referral_source: 0,
      records_with_appointment_type: 0,
      records_with_treatment_category: 0,
      records_with_notes: 0,
      sample_referral_sources: new Set(),
      sample_appointment_types: new Set(),
      sample_treatment_categories: new Set()
    }

    console.log('=== ANALYZING CATEGORY FIELDS ===')
    console.log('Recent data records found:', recentData?.length || 0)
    
    recentData?.forEach(record => {
      if (record.referral_source && record.referral_source.trim() !== '') {
        categoryAnalysis.records_with_referral_source++
        categoryAnalysis.sample_referral_sources.add(record.referral_source)
      }
      if (record.appointment_type && record.appointment_type.trim() !== '') {
        categoryAnalysis.records_with_appointment_type++
        categoryAnalysis.sample_appointment_types.add(record.appointment_type)
      }
      if (record.treatment_category && record.treatment_category.trim() !== '') {
        categoryAnalysis.records_with_treatment_category++
        categoryAnalysis.sample_treatment_categories.add(record.treatment_category)
      }
      if (record.notes && record.notes.trim() !== '') {
        categoryAnalysis.records_with_notes++
      }
      
      console.log(`Record analysis:`, record.id, { referral_source: record.referral_source, appointment_type: record.appointment_type, treatment_category: record.treatment_category })
    })

    // Convert Sets to Arrays for JSON serialization
    const analysisResult = {
      ...categoryAnalysis,
      sample_referral_sources: Array.from(categoryAnalysis.sample_referral_sources),
      sample_appointment_types: Array.from(categoryAnalysis.sample_appointment_types),
      sample_treatment_categories: Array.from(categoryAnalysis.sample_treatment_categories)
    }

    console.log('=== CATEGORY FIELD ANALYSIS ===')
    console.log('Analysis result:', JSON.stringify(analysisResult, null, 2))

    // 4. Check for data integrity issues
    const integrityChecks = {
      records_with_null_referral_source: recentData?.filter(r => r.referral_source === null).length || 0,
      records_with_empty_referral_source: recentData?.filter(r => r.referral_source === '').length || 0,
      records_with_null_appointment_type: recentData?.filter(r => r.appointment_type === null).length || 0,
      records_with_empty_appointment_type: recentData?.filter(r => r.appointment_type === '').length || 0,
      records_with_null_treatment_category: recentData?.filter(r => r.treatment_category === null).length || 0,
      records_with_empty_treatment_category: recentData?.filter(r => r.treatment_category === '').length || 0
    }

    console.log('=== DATA INTEGRITY CHECKS ===')
    console.log('Integrity analysis:', JSON.stringify(integrityChecks, null, 2))

    // 5. Sample raw records for manual inspection
    console.log('=== SAMPLE RAW RECORDS ===')
    recentData?.slice(0, 3).forEach((record, index) => {
      console.log(`Raw Record ${index + 1}:`, {
        id: record.id,
        date: record.date,
        referral_type: record.referral_type,
        referral_source: record.referral_source,
        appointment_type: record.appointment_type,
        treatment_category: record.treatment_category,
        notes: record.notes,
        production_amount: record.production_amount,
        patient_count: record.patient_count,
        created_at: record.created_at
      })
    })

    console.log('=== VERIFICATION COMPLETE ===')
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total_count: totalCount,
          recent_records: recentData,
          category_analysis: analysisResult,
          integrity_checks: integrityChecks
        },
        message: 'Database verification completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verification error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})