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

interface DataSharingRequest {
  clientIds: string[]
  purpose: 'aggregated_reporting' | 'product_improvement' | 'usage_analytics' | 'internal_analysis'
  dataTypes: ('ga4' | 'gsc' | 'gbp' | 'clarity' | 'pms' | 'tasks')[]
}

interface DataSharingResponse {
  allowedClients: string[]
  blockedClients: string[]
  allowedDataTypes: string[]
  restrictions: {
    clientId: string
    blockedDataTypes: string[]
    reason: string
  }[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Check Data Sharing Permissions Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const request: DataSharingRequest = await req.json()
    console.log('Data sharing permission check request:', {
      clientCount: request.clientIds?.length || 0,
      purpose: request.purpose,
      dataTypes: request.dataTypes
    })

    if (!request.clientIds || !Array.isArray(request.clientIds) || request.clientIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'clientIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!request.purpose || !request.dataTypes || !Array.isArray(request.dataTypes)) {
      return new Response(
        JSON.stringify({ error: 'purpose and dataTypes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user preferences for all clients
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('client_id, data_sharing_enabled, usage_analytics_enabled, email')
      .in('client_id', request.clientIds)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching user preferences:', usersError)
      throw new Error(`Failed to fetch user preferences: ${usersError.message}`)
    }

    console.log(`Found ${users?.length || 0} users for ${request.clientIds.length} clients`)

    const response: DataSharingResponse = {
      allowedClients: [],
      blockedClients: [],
      allowedDataTypes: [],
      restrictions: []
    }

    // Check permissions for each client
    for (const clientId of request.clientIds) {
      const clientUsers = users?.filter(u => u.client_id === clientId) || []
      
      if (clientUsers.length === 0) {
        // No users found for this client - block by default
        response.blockedClients.push(clientId)
        response.restrictions.push({
          clientId,
          blockedDataTypes: request.dataTypes,
          reason: 'No active users found for client'
        })
        continue
      }

      // Check if ANY user for this client has opted out
      const hasDataSharingOptOut = clientUsers.some(user => !user.data_sharing_enabled)
      const hasUsageAnalyticsOptOut = clientUsers.some(user => !user.usage_analytics_enabled)

      let clientAllowed = true
      const blockedDataTypes: string[] = []

      // Apply restrictions based on purpose and user preferences
      if (request.purpose === 'usage_analytics' && hasUsageAnalyticsOptOut) {
        clientAllowed = false
        blockedDataTypes.push(...request.dataTypes)
        response.restrictions.push({
          clientId,
          blockedDataTypes: request.dataTypes,
          reason: 'User has opted out of usage analytics'
        })
      } else if (['aggregated_reporting', 'product_improvement', 'internal_analysis'].includes(request.purpose) && hasDataSharingOptOut) {
        clientAllowed = false
        blockedDataTypes.push(...request.dataTypes)
        response.restrictions.push({
          clientId,
          blockedDataTypes: request.dataTypes,
          reason: 'User has opted out of data sharing'
        })
      }

      if (clientAllowed) {
        response.allowedClients.push(clientId)
      } else {
        response.blockedClients.push(clientId)
      }
    }

    // Determine allowed data types (only if we have allowed clients)
    if (response.allowedClients.length > 0) {
      response.allowedDataTypes = request.dataTypes
    }

    console.log('Data sharing permissions result:', {
      allowedClients: response.allowedClients.length,
      blockedClients: response.blockedClients.length,
      restrictions: response.restrictions.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        message: `Processed permissions for ${request.clientIds.length} clients`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error checking data sharing permissions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Example usage function for internal data processing
export async function filterDataByPermissions(
  clientIds: string[], 
  purpose: string, 
  dataTypes: string[]
): Promise<string[]> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/check-data-sharing-permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientIds,
        purpose,
        dataTypes
      })
    })

    if (!response.ok) {
      throw new Error(`Permission check failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      return data.data.allowedClients
    } else {
      throw new Error(data.error || 'Permission check failed')
    }

  } catch (error) {
    console.error('Error filtering data by permissions:', error)
    // Default to blocking all clients if permission check fails
    return []
  }
}