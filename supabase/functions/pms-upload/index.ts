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

interface PMSRecord {
  date: string
  referral_type: string
  referral_source?: string
  patient_count: number // Will always be 1 for each record
  production_amount: number // Renamed from revenue_amount
  appointment_type?: string
  treatment_category?: string
  notes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    
    const { clientId, csvData } = body

    if (!clientId || !csvData) {
      console.error('Missing required fields:', { hasClientId: !!clientId, hasCsvData: !!csvData })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientId, csvData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // Validate and process CSV data
    const validatedData: PMSRecord[] = []
    const errors: string[] = []

    csvData.forEach((row: any, index: number) => {
      const rowNumber = index + 1
      const validationResult = validatePMSRow(row, rowNumber)
      
      if (validationResult.isValid && validationResult.data) {
        validatedData.push({
          ...validationResult.data,
          client_id: clientId,
          patient_count: 1 // Each row represents one patient referral event
        })
      } else {
        errors.push(...validationResult.errors)
      }
    })

    // Check for validation errors
    if (errors.length > 0) {
      console.error('Validation errors:', errors)
      return new Response(
        JSON.stringify({
          error: 'CSV validation failed',
          details: errors.slice(0, 10), // Limit to first 10 errors
          totalErrors: errors.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (validatedData.length === 0) {
      console.error('No valid data after validation')
      return new Response(
        JSON.stringify({ error: 'No valid data found in CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store data in database
    const insertData = validatedData.map(record => ({
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    

    const { data, error } = await supabase
      .from('pms_data')
      .insert(insertData)
      .select()

    if (error) {
      console.error('=== DATABASE INSERT ERROR ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Error hint:', error.hint)
      return new Response(
        JSON.stringify({ error: `Failed to store PMS data: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully uploaded ${data?.length || 0} PMS records`,
        data: {
          recordsProcessed: csvData.length,
          recordsStored: data?.length || 0,
          validationErrors: errors.length,
          storedRecords: data
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PMS upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
)

/**
 * Validate PMS CSV row data
 */
function validatePMSRow(row: any, rowNumber: number): { isValid: boolean; data?: Omit<PMSRecord, 'patient_count'>; errors: string[] } {
  const errors: string[] = []
  
  // Check required fields: Date, Referral_Type, Production_Amount
  const requiredFields = ['date', 'referral_type', 'production_amount'];
  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (row.date && !dateRegex.test(row.date.toString())) {
    errors.push(`Row ${rowNumber}: Invalid date format. Expected YYYY-MM-DD`)
  }

  // Validate referral_type against database constraint values
  const validReferralTypes = ['doctor_referral', 'self_referral', 'insurance_referral', 'emergency', 'other'];
  const trimmedReferralType = row.referral_type?.toString().trim();
  if (!trimmedReferralType) {
    errors.push(`Row ${rowNumber}: Referral_Type cannot be empty`);
  } else if (!validReferralTypes.includes(trimmedReferralType)) {
    errors.push(`Row ${rowNumber}: Invalid referral_type '${trimmedReferralType}'. Must be one of: ${validReferralTypes.join(', ')}`);
  }
  
  // Validate production_amount is a number
  if (row.production_amount && isNaN(parseFloat(row.production_amount.toString()))) {
    errors.push(`Row ${rowNumber}: production_amount must be a number`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  // Return cleaned data
  const processedData = {
    date: row.date.toString(),
    referral_type: trimmedReferralType,
    referral_source: row.referral_source && row.referral_source.toString().trim() !== '' ? row.referral_source.toString().trim() : null,
    production_amount: parseFloat(row.production_amount?.toString()) || 0,
    appointment_type: row.appointment_type && row.appointment_type.toString().trim() !== '' ? row.appointment_type.toString().trim() : null,
    treatment_category: row.treatment_category && row.treatment_category.toString().trim() !== '' ? row.treatment_category.toString().trim() : null,
    notes: row.notes && row.notes.toString().trim() !== '' ? row.notes.toString().trim() : null
  }
  
  return {
    isValid: true,
    data: processedData,
    errors: []
  }
}