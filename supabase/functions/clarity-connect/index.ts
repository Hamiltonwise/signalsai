const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Clarity Connect Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    console.log('Request body:', body)
    
    const { clientId, apiToken, projectId } = body

    if (!clientId || !apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clientId, apiToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Connecting Clarity for client:', clientId)

    // For demo purposes, we'll skip the actual Clarity API validation
    // In production, you would validate the API token here
    console.log('Skipping Clarity API validation for demo...')

    // Store credentials in database
    console.log('Storing Clarity credentials in database...')
    
    const credentials = {
      client_id: clientId,
      service_name: 'clarity',
      credential_type: 'api_key',
      encrypted_value: btoa(apiToken), // Simple base64 encoding for demo
      metadata: {
        project_id: projectId || 'demo-project',
        connected_at: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Delete existing Clarity credentials for this client
    const { error: deleteError } = await supabase
      .from('api_credentials')
      .delete()
      .eq('client_id', clientId)
      .eq('service_name', 'clarity')

    if (deleteError) {
      console.log('Note: No existing Clarity credentials to delete:', deleteError.message)
    }

    // Insert new credentials
    const { data: insertedData, error: insertError } = await supabase
      .from('api_credentials')
      .insert([credentials])
      .select()

    if (insertError) {
      console.error('Database error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to store credentials: ${insertError.message}`,
          details: insertError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Clarity credentials stored successfully:', insertedData)

    // Also create an integration account record
    const integrationAccount = {
      client_id: clientId,
      platform: 'clarity',
      account_name: `Clarity Project ${projectId || 'Demo'}`,
      encrypted_credentials: JSON.stringify({ api_token: apiToken }),
      connection_status: 'active',
      metadata: {
        project_id: projectId || 'demo-project',
        connected_at: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Delete existing integration account
    await supabase
      .from('integration_accounts')
      .delete()
      .eq('client_id', clientId)
      .eq('platform', 'clarity')

    // Insert new integration account
    const { error: integrationError } = await supabase
      .from('integration_accounts')
      .insert([integrationAccount])

    if (integrationError) {
      console.error('Integration account error:', integrationError)
      // Don't fail the whole request for this
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Microsoft Clarity connected successfully',
        data: {
          projectId: projectId || 'demo-project',
          connectedAt: new Date().toISOString(),
          credentialsStored: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Clarity connect error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})