const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    const {
      id,
      practice_name,
      contact_person,
      email,
      phone_number,
      website_url,
      timezone = 'America/New_York'
    } = await req.json()

    if (!practice_name || !contact_person || !email) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: practice_name, contact_person, email'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if client already exists with this email
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single()

    if (existingClient) {
      return new Response(
        JSON.stringify({
          success: true,
          data: existingClient,
          message: 'Client already exists'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientData = {
      ...(id && { id }),
      practice_name,
      contact_person,
      email,
      phone_number,
      website_url,
      timezone,
      account_status: 'trial'
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: 'Client created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating client:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})