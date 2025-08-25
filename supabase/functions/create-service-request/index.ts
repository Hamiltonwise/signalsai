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

interface ServiceRequestData {
  title: string
  description: string
  type: 'website_change' | 'promotion' | 'other'
  clientId: string
  userEmail: string
  userName: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Create Service Request Function Called ===')
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
    console.log('Request body received:', body)
    
    const { title, description, type, clientId, userEmail, userName } = body

    if (!title || !description || !type || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, description, type, clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('=== Getting Monday.com Credentials ===')
    
    // Get Monday.com credentials for this client
    const { data: integrationAccount, error: integrationError } = await supabase
      .from('integration_accounts')
      .select('encrypted_credentials, monday_workspace_id')
      .eq('client_id', clientId)
      .eq('platform', 'monday')
      .eq('connection_status', 'active')
      .single()

    if (integrationError || !integrationAccount) {
      console.error('Monday.com integration not found:', integrationError?.message)
      return new Response(
        JSON.stringify({ 
          error: 'Monday.com integration not found for this client. Please connect Monday.com in Settings first.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mondayApiToken = Deno.env.get('MONDAY_API_TOKEN')
    if (!mondayApiToken) {
      console.error('Monday.com API token not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Monday.com API token not configured. Please add MONDAY_API_TOKEN to environment variables.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const workspaceId = integrationAccount.monday_workspace_id
    console.log('Using workspace ID:', workspaceId)

    // Step 1: Find the "Service Request" board in the workspace
    console.log('=== Finding Service Request Board ===')
    
    const findBoardQuery = `query {
      boards(workspace_ids: [${workspaceId}], limit: 50) {
        id
        name
        columns {
          id
          title
          type
        }
      }
    }`

    const findBoardResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query: findBoardQuery })
    })

    if (!findBoardResponse.ok) {
      const errorText = await findBoardResponse.text()
      console.error('Failed to fetch boards:', findBoardResponse.status, errorText)
      throw new Error(`Failed to fetch Monday.com boards: ${errorText}`)
    }

    const boardsData = await findBoardResponse.json()
    
    if (boardsData.errors) {
      console.error('Monday.com GraphQL errors:', boardsData.errors)
      throw new Error(`Monday.com error: ${boardsData.errors[0]?.message || 'Unknown error'}`)
    }

    const boards = boardsData.data?.boards || []
    console.log(`Found ${boards.length} boards in workspace`)
    
    // Find the Service Request board (case-insensitive)
    const serviceRequestBoard = boards.find(board => 
      board.name.toLowerCase().includes('service request') ||
      board.name.toLowerCase().includes('service-request') ||
      board.name.toLowerCase().includes('servicerequest')
    )

    if (!serviceRequestBoard) {
      const availableBoards = boards.map(b => b.name).join(', ')
      console.error('Service Request board not found. Available boards:', availableBoards)
      return new Response(
        JSON.stringify({ 
          error: `Service Request board not found in workspace. Available boards: ${availableBoards}. Please create a "Service Request" board first.` 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found Service Request board:', serviceRequestBoard.name, 'ID:', serviceRequestBoard.id)
    console.log('Board columns:', serviceRequestBoard.columns.map(c => ({ id: c.id, title: c.title, type: c.type })))

    // Step 2: Map columns by title (case-insensitive)
    const columns = serviceRequestBoard.columns
    const requestTypeColumn = columns.find(col => 
      col.title.toLowerCase().includes('request type') ||
      col.title.toLowerCase().includes('type')
    )
    const descriptionColumn = columns.find(col => 
      col.title.toLowerCase().includes('description')
    )
    const dateRequestedColumn = columns.find(col => 
      col.title.toLowerCase().includes('date requested') ||
      col.title.toLowerCase().includes('requested') ||
      col.title.toLowerCase().includes('date')
    )

    console.log('=== Column Mapping ===')
    console.log('Request Type column:', requestTypeColumn ? `${requestTypeColumn.title} (${requestTypeColumn.id})` : 'Not found')
    console.log('Description column:', descriptionColumn ? `${descriptionColumn.title} (${descriptionColumn.id})` : 'Not found')
    console.log('Date Requested column:', dateRequestedColumn ? `${dateRequestedColumn.title} (${dateRequestedColumn.id})` : 'Not found')

    // Step 3: Create the item on Monday.com
    console.log('=== Creating Monday.com Item ===')
    
    // Build column values object
    const columnValues: any = {}
    
    if (requestTypeColumn) {
      // For text columns, use simple text value
      if (requestTypeColumn.type === 'text') {
        columnValues[requestTypeColumn.id] = type.replace('_', ' ')
      } else {
        // For other column types, try text format
        columnValues[requestTypeColumn.id] = { text: type.replace('_', ' ') }
      }
    }
    
    if (descriptionColumn) {
      if (descriptionColumn.type === 'text' || descriptionColumn.type === 'long-text') {
        columnValues[descriptionColumn.id] = description
      } else {
        columnValues[descriptionColumn.id] = { text: description }
      }
    }
    
    if (dateRequestedColumn) {
      const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      if (dateRequestedColumn.type === 'date') {
        columnValues[dateRequestedColumn.id] = { date: currentDate }
      } else {
        columnValues[dateRequestedColumn.id] = currentDate
      }
    }

    console.log('Column values to set:', columnValues)

    const createItemMutation = `mutation {
      create_item(
        board_id: ${serviceRequestBoard.id},
        item_name: "${title.replace(/"/g, '\\"')}",
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
        name
        created_at
        column_values {
          id
          text
        }
      }
    }`

    console.log('Creating item with mutation:', createItemMutation)

    const createItemResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Authorization': mondayApiToken,
        'Content-Type': 'application/json',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query: createItemMutation })
    })

    console.log('Create item response status:', createItemResponse.status)

    if (!createItemResponse.ok) {
      const errorText = await createItemResponse.text()
      console.error('Failed to create Monday.com item:', createItemResponse.status, errorText)
      throw new Error(`Failed to create Monday.com item: ${errorText}`)
    }

    const createItemData = await createItemResponse.json()
    console.log('Create item response:', JSON.stringify(createItemData, null, 2))

    if (createItemData.errors) {
      console.error('Monday.com create item errors:', createItemData.errors)
      throw new Error(`Monday.com error: ${createItemData.errors[0]?.message || 'Unknown error'}`)
    }

    const createdItem = createItemData.data?.create_item
    if (!createdItem) {
      throw new Error('No item returned from Monday.com create_item mutation')
    }

    console.log('Successfully created Monday.com item:', createdItem.id, createdItem.name)

    // Step 4: Store the service request in database for persistence
    console.log('=== Storing Service Request in Database ===')
    
    const serviceRequestRecord = {
      id: createdItem.id, // Use Monday.com item ID
      client_id: clientId,
      title: title,
      description: description,
      request_type: type,
      status: 'pending',
      monday_item_id: createdItem.id,
      monday_board_id: serviceRequestBoard.id,
      created_by_email: userEmail,
      created_by_name: userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store in database
    const { data: storedRequest, error: storeError } = await supabase
      .from('service_requests')
      .insert([serviceRequestRecord])
      .select()
      .single()

    if (storeError) {
      console.error('Error storing service request:', storeError)
      // Don't fail the whole request - Monday.com item was created successfully
      console.log('Monday.com item created but database storage failed:', storeError.message)
    } else {
      console.log('Service request stored in database:', storedRequest.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Service request created successfully on Monday.com',
        data: {
          mondayItemId: createdItem.id,
          mondayItemName: createdItem.name,
          boardId: serviceRequestBoard.id,
          boardName: serviceRequestBoard.name,
          createdAt: createdItem.created_at,
          columnValues: createdItem.column_values,
          storedInDatabase: !storeError
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create service request error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Supabase Edge Function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})