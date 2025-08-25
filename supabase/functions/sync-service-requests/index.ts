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

  console.log('=== Sync Service Requests Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { clientId } = body

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Syncing service requests for client:', clientId)

    // Get all service requests for this client that need syncing
    const { data: serviceRequests, error: fetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('client_id', clientId)
      .neq('status', 'completed') // Only sync non-completed requests
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching service requests:', fetchError)
      throw new Error(`Failed to fetch service requests: ${fetchError.message}`)
    }

    if (!serviceRequests || serviceRequests.length === 0) {
      console.log('No service requests found to sync')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No service requests to sync',
          data: { syncedRequests: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${serviceRequests.length} service requests to sync`)

    // Get Monday.com credentials
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN')
    if (!mondayApiToken) {
      throw new Error('Monday.com API token not configured')
    }

    const syncResults = []
    const errors = []

    // Sync each service request
    for (const request of serviceRequests) {
      try {
        console.log(`Syncing request: ${request.title} (${request.monday_item_id})`)

        // Get current status from Monday.com
        const itemQuery = `query {
          items(ids: [${request.monday_item_id}]) {
            id
            name
            column_values {
              id
              text
              title
            }
          }
        }`

        const itemResponse = await fetch('https://api.monday.com/v2', {
          method: 'POST',
          headers: {
            'Authorization': mondayApiToken,
            'Content-Type': 'application/json',
            'API-Version': '2023-10'
          },
          body: JSON.stringify({ query: itemQuery })
        })

        if (!itemResponse.ok) {
          throw new Error(`Monday.com API error: ${itemResponse.status}`)
        }

        const itemData = await itemResponse.json()
        
        if (itemData.errors) {
          throw new Error(`Monday.com GraphQL error: ${itemData.errors[0]?.message}`)
        }

        const item = itemData.data?.items?.[0]
        if (!item) {
          console.log(`Item ${request.monday_item_id} not found on Monday.com, skipping`)
          continue
        }

        // Find status column
        const statusColumn = item.column_values?.find(col => 
          col.title?.toLowerCase().includes('status') ||
          col.id === 'status'
        )

        if (!statusColumn) {
          console.log(`No status column found for item ${request.monday_item_id}`)
          continue
        }

        // Map Monday.com status to our database status
        const mondayStatus = statusColumn.text?.toLowerCase() || ''
        let newStatus = request.status // Default to current status

        if (mondayStatus.includes('working') || mondayStatus.includes('progress')) {
          newStatus = 'in_progress'
        } else if (mondayStatus.includes('done') || mondayStatus.includes('complete')) {
          newStatus = 'completed'
        } else if (mondayStatus.includes('cancel')) {
          newStatus = 'cancelled'
        } else if (mondayStatus.includes('pending') || mondayStatus === '') {
          newStatus = 'pending'
        }

        // Update database if status changed
        if (newStatus !== request.status) {
          console.log(`Status changed for ${request.title}: ${request.status} → ${newStatus}`)

          const updateData: any = {
            status: newStatus,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Set completion date if completed
          if (newStatus === 'completed' && !request.date_completed) {
            updateData.date_completed = new Date().toISOString()
          }

          const { error: updateError } = await supabase
            .from('service_requests')
            .update(updateData)
            .eq('id', request.id)

          if (updateError) {
            throw new Error(`Failed to update request: ${updateError.message}`)
          }

          syncResults.push({
            requestId: request.id,
            title: request.title,
            oldStatus: request.status,
            newStatus: newStatus,
            mondayStatus: statusColumn.text
          })
        } else {
          // Update last_synced_at even if no status change
          await supabase
            .from('service_requests')
            .update({ 
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', request.id)
        }

      } catch (requestError) {
        console.error(`Error syncing request ${request.id}:`, requestError)
        errors.push({
          requestId: request.id,
          title: request.title,
          error: requestError.message
        })
      }

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Sync completed. Updated: ${syncResults.length}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${serviceRequests.length} service requests`,
        data: {
          totalRequests: serviceRequests.length,
          updatedRequests: syncResults.length,
          errors: errors.length,
          syncResults,
          errorDetails: errors.slice(0, 5)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing service requests:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})