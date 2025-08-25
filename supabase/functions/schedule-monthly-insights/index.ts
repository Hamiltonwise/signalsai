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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Schedule Monthly Insights Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    // This function is designed to be called by a cron job or webhook
    // at the start of each month to generate insights for all active clients

    console.log('Fetching all active clients...')

    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, practice_name, account_status')
      .eq('account_status', 'active')

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`)
    }

    if (!clients || clients.length === 0) {
      console.log('No active clients found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active clients found',
          data: { processedClients: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${clients.length} active clients`)

    const results = []
    const errors = []

    // Generate insights for each client
    for (const client of clients) {
      try {
        console.log(`Generating insights for client: ${client.practice_name} (${client.id})`)

        // Call the generate-ai-insights function for this client
        const generateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ai-insights`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: client.id,
            forceRefresh: true
          })
        })

        const generateData = await generateResponse.json()

        if (generateResponse.ok && generateData.success) {
          results.push({
            clientId: client.id,
            practiceName: client.practice_name,
            status: 'success',
            message: 'Insights generated successfully'
          })
          console.log(`✓ Successfully generated insights for ${client.practice_name}`)
        } else {
          throw new Error(generateData.error || 'Failed to generate insights')
        }

      } catch (clientError) {
        console.error(`✗ Error generating insights for ${client.practice_name}:`, clientError)
        errors.push({
          clientId: client.id,
          practiceName: client.practice_name,
          error: clientError.message
        })
      }

      // Add a small delay between requests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Monthly insights generation completed. Success: ${results.length}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monthly insights generation completed`,
        data: {
          processedClients: clients.length,
          successfulClients: results.length,
          failedClients: errors.length,
          results,
          errors: errors.slice(0, 5) // Include first 5 errors in response
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in monthly insights scheduling:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})