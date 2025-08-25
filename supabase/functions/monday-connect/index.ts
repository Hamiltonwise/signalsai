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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Monday Connect Function Called ===')
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
    console.log('Request body received:', body)
    
    const { clientId, workspaceId } = body

    if (!clientId || !workspaceId) {
      console.error('Missing required parameters:', { hasClientId: !!clientId, hasWorkspaceId: !!workspaceId })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: clientId, workspaceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Environment Variables Check ===')
    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Has MONDAY_API_TOKEN:', !!mondayApiToken)
    console.log('Has SUPABASE_URL:', !!supabaseUrl)
    console.log('Has SERVICE_ROLE_KEY:', !!serviceRoleKey)
    
    if (!mondayApiToken) {
      console.error('MONDAY_API_TOKEN environment variable not set')
      return new Response(
        JSON.stringify({ 
          error: 'Monday.com API token not configured. Please add MONDAY_API_TOKEN to Supabase Edge Functions environment variables.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Testing Monday.com API Connection ===')
    console.log('API Token (first 10 chars):', mondayApiToken.substring(0, 10) + '...')
    console.log('Workspace ID to find:', workspaceId)

    // Test Monday.com API connection and find workspace
    const testQuery = `query {
      me {
        id
        name
        email
      }
      workspaces {
        id
        name
        description
      }
    }`

    console.log('Making test API call to Monday.com...')
    const testResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query: testQuery })
    })

    console.log('Monday.com API test response status:', testResponse.status)
    console.log('Monday.com API test response headers:', Object.fromEntries(testResponse.headers.entries()))

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Monday.com API test failed:', testResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: `Monday.com API connection failed: ${testResponse.status} - ${errorText}. Please check your MONDAY_API_TOKEN.` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const testData = await testResponse.json()
    console.log('Monday.com API test response:', JSON.stringify(testData, null, 2))

    if (testData.errors) {
      console.error('Monday.com GraphQL errors:', testData.errors)
      return new Response(
        JSON.stringify({ 
          error: `Monday.com API error: ${testData.errors[0]?.message || 'Unknown GraphQL error'}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = testData.data?.me
    const workspaces = testData.data?.workspaces || []
    
    console.log('=== Monday.com API Connection Successful ===')
    console.log('Connected as user:', user?.name, '(', user?.email, ')')
    console.log('Available workspaces:', workspaces.length)
    
    workspaces.forEach((workspace, index) => {
      console.log(`Workspace ${index + 1}:`, {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description
      })
    })

    // Find the workspace by ID or name
    let targetWorkspace = null
    
    // First try exact ID match
    targetWorkspace = workspaces.find(ws => ws.id === workspaceId)
    
    if (!targetWorkspace) {
      // Try exact name match (case-insensitive)
      targetWorkspace = workspaces.find(ws => 
        ws.name?.toLowerCase() === workspaceId.toLowerCase()
      )
    }
    
    if (!targetWorkspace) {
      // Try partial name match (case-insensitive)
      targetWorkspace = workspaces.find(ws => 
        ws.name?.toLowerCase().includes(workspaceId.toLowerCase()) ||
        workspaceId.toLowerCase().includes(ws.name?.toLowerCase())
      )
    }

    console.log('=== Workspace Search Results ===')
    console.log('Search term:', workspaceId)
    console.log('Target workspace found:', !!targetWorkspace)
    if (targetWorkspace) {
      console.log('Matched workspace:', {
        id: targetWorkspace.id,
        name: targetWorkspace.name,
        description: targetWorkspace.description
      })
    }

    if (!targetWorkspace) {
      const availableWorkspaces = workspaces.map(ws => `"${ws.name}" (ID: ${ws.id})`).join(', ')
      console.error('Workspace not found. Available workspaces:', availableWorkspaces)
      
      return new Response(
        JSON.stringify({ 
          error: `Workspace "${workspaceId}" not found. Available workspaces: ${availableWorkspaces}. Please check the spelling or contact support.` 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Storing Integration Account ===')
    console.log('Client ID:', clientId)
    console.log('Workspace ID to store:', targetWorkspace.id)
    console.log('Workspace name to store:', targetWorkspace.name)

    // Store the integration account with workspace ID
    const integrationData = {
      client_id: clientId,
      platform: 'monday',
      account_name: targetWorkspace.name,
      encrypted_credentials: JSON.stringify({
        workspace_id: targetWorkspace.id,
        workspace_name: targetWorkspace.name
      }),
      connection_status: 'active',
      monday_workspace_id: targetWorkspace.id,
      metadata: {
        workspace_name: targetWorkspace.name,
        workspace_description: targetWorkspace.description,
        connected_at: new Date().toISOString(),
        connected_by_user: user?.name,
        api_test_successful: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Delete existing Monday.com integration for this client
    const { error: deleteError } = await supabase
      .from('integration_accounts')
      .delete()
      .eq('client_id', clientId)
      .eq('platform', 'monday')

    if (deleteError) {
      console.log('Note: No existing Monday integration to delete:', deleteError.message)
    }

    // Insert new integration
    const { data: insertedData, error: insertError } = await supabase
      .from('integration_accounts')
      .insert([integrationData])
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to store integration: ${insertError.message}`,
          details: insertError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Integration stored successfully:', insertedData)

    // Update the client record with the Monday workspace mapping
    console.log('=== Updating Client Record ===')
    console.log('Updating client with Monday workspace info...')
    
    const { error: clientUpdateError } = await supabase
      .from('clients')
      .update({
        tasks_client_id: targetWorkspace.name, // Store workspace name for task mapping
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

    if (clientUpdateError) {
      console.error('Error updating client with workspace info:', clientUpdateError)
      // Don't fail the whole connection for this, just log it
    } else {
      console.log('Client record updated with Monday workspace mapping')
    }

    // Test fetching boards from the workspace to validate access
    console.log('=== Testing Board Access ===')
    const boardsQuery = `query {
      boards(workspace_ids: [${targetWorkspace.id}], limit: 10) {
        id
        name
        workspace {
          id
          name
        }
        items_page(limit: 5) {
          items {
            id
            name
          }
        }
      }
    }`

    const boardsResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query: boardsQuery })
    })

    if (boardsResponse.ok) {
      const boardsData = await boardsResponse.json()
      const boards = boardsData.data?.boards || []
      
      console.log(`Found ${boards.length} boards in workspace "${targetWorkspace.name}"`)
      boards.forEach(board => {
        console.log(`- Board: "${board.name}" (${board.id}) - ${board.items_page?.items?.length || 0} items`)
      })
    } else {
      console.log('Board access test failed, but connection was successful')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monday.com workspace "${targetWorkspace.name}" connected successfully`,
        data: {
          workspaceId: targetWorkspace.id,
          workspaceName: targetWorkspace.name,
          connectedAt: new Date().toISOString(),
          integrationStored: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Monday connect error:', error)
    console.error('Error stack:', error.stack)
    
    // Provide more specific error messages
    let errorMessage = error.message
    if (error.message.includes('fetch')) {
      errorMessage = 'Failed to connect to Monday.com API. Please check your internet connection.'
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid response from Monday.com API. Please try again.'
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})