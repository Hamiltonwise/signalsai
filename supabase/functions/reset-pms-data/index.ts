import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Reset PMS Data Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use DELETE to reset data.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId')
    const confirmReset = url.searchParams.get('confirm')

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (confirmReset !== 'true') {
      return new Response(
        JSON.stringify({ error: 'confirm=true parameter is required to reset data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Resetting PMS data for client:', clientId)

    // First, check how much data exists
    const { count: existingCount, error: countError } = await supabase
      .from('pms_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (countError) {
      console.error('Error counting existing data:', countError)
      throw new Error(`Failed to count existing data: ${countError.message}`)
    }

    console.log('Found', existingCount, 'existing PMS records for client')

    // Delete all PMS data for this client
    const { error: deleteError } = await supabase
      .from('pms_data')
      .delete()
      .eq('client_id', clientId)

    if (deleteError) {
      console.error('Error deleting PMS data:', deleteError)
      throw new Error(`Failed to delete PMS data: ${deleteError.message}`)
    }

    console.log('Successfully deleted', existingCount, 'PMS records')

    // Verify deletion
    const { count: remainingCount, error: verifyError } = await supabase
      .from('pms_data')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)

    if (verifyError) {
      console.error('Error verifying deletion:', verifyError)
    }

    console.log('Remaining records after deletion:', remainingCount)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully reset PMS data for client ${clientId}`,
        data: {
          recordsDeleted: existingCount,
          remainingRecords: remainingCount || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Reset PMS data error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})