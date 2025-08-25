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

interface MondayBoard {
  id: string
  name: string
  items_page: {
    items: MondayItem[]
  }
}

interface MondayItem {
  id: string
  name: string
  column_values: MondayColumnValue[]
  created_at: string
  updated_at: string
}

interface MondayColumnValue {
  id: string
  title: string
  text: string
  type: string
  value?: any
}

// Simple base64 decoding for demo - in production use proper decryption
const decryptData = (encryptedData: string): string => {
  return atob(encryptedData)
}

const getMondayCredentials = async (clientId: string) => {
  console.log('=== Getting Monday Credentials ===')
  console.log('Looking up client:', clientId)
  
  // Get the client's practice name or tasks_client_id for workspace mapping
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('practice_name, tasks_client_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    console.error('Error fetching client data:', clientError?.message || 'No client found')
    return null
  }

  console.log('Client data found:', {
    practice_name: client.practice_name,
    tasks_client_id: client.tasks_client_id
  })

  // Get internal API token from environment
  const apiToken = Deno.env.get('MONDAY_API_TOKEN')
  
  // Use tasks_client_id if available, otherwise fall back to practice_name
  const workspaceIdentifier = client.tasks_client_id || client.practice_name

  if (!apiToken) {
    console.error('Monday.com API token not configured in environment variables')
    return null
  }

  if (!workspaceIdentifier) {
    console.error('No workspace identifier found (tasks_client_id or practice_name)')
    return null
  }

  console.log('Using workspace identifier:', workspaceIdentifier)
  return { apiToken, workspaceId: workspaceIdentifier }
}

const fetchWorkspaceBoards = async (apiToken: string, workspaceId: string): Promise<MondayBoard[]> => {
  console.log('Fetching boards from Monday.com workspace:', workspaceId)

  // Step 1: Find the workspace by name
  const workspaceQuery = `query {
    workspaces(limit: 50) {
      id
      name
    }
  }`

  console.log('Step 1: Finding workspace by name...')
  const workspaceResponse = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiToken,
      'Content-Type': 'application/json',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query: workspaceQuery })
  })

  if (!workspaceResponse.ok) {
    const errorText = await workspaceResponse.text()
    console.error('Monday.com workspace query failed:', workspaceResponse.status, errorText)
    throw new Error(`Monday.com workspace query failed: ${workspaceResponse.status} - ${errorText}`)
  }

  const workspaceData = await workspaceResponse.json()
  
  if (workspaceData.errors) {
    console.error('Monday.com workspace GraphQL errors:', workspaceData.errors)
    throw new Error(`Monday.com workspace GraphQL error: ${workspaceData.errors[0]?.message || 'Unknown error'}`)
  }

  const workspaces = workspaceData.data?.workspaces || []
  console.log(`Found ${workspaces.length} total workspaces`)
  
  // Find the target workspace by name (case-insensitive)
  const targetWorkspace = workspaces.find(ws => 
    ws.name?.toLowerCase() === workspaceId.toLowerCase()
  )

  if (!targetWorkspace) {
    const availableWorkspaces = workspaces.map(ws => ws.name).join(', ')
    console.error('Target workspace not found:', workspaceId)
    console.error('Available workspaces:', availableWorkspaces)
    throw new Error(`Workspace "${workspaceId}" not found. Available workspaces: ${availableWorkspaces}`)
  }

  console.log('Found target workspace:', targetWorkspace.name, 'ID:', targetWorkspace.id)

  // Step 2: Get all boards from this specific workspace
  const boardsQuery = `query {
    boards(workspace_ids: [${targetWorkspace.id}], limit: 50) {
      id
      name
      items_page(limit: 25) {
        items {
          id
          name
          created_at
          column_values(ids: ["status", "person", "date"]) {
            id
            text
          }
        }
      }
    }
  }`

  console.log('Step 2: Fetching boards from workspace ID:', targetWorkspace.id)
  const boardsResponse = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiToken,
      'Content-Type': 'application/json',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query: boardsQuery })
  })

  if (!boardsResponse.ok) {
    const errorText = await boardsResponse.text()
    console.error('Monday.com boards query failed:', boardsResponse.status, errorText)
    throw new Error(`Monday.com boards query failed: ${boardsResponse.status} - ${errorText}`)
  }

  const boardsData = await boardsResponse.json()
  
  if (boardsData.errors) {
    console.error('Monday.com boards GraphQL errors:', boardsData.errors)
    throw new Error(`Monday.com boards GraphQL error: ${boardsData.errors[0]?.message || 'Unknown error'}`)
  }

  const boards = boardsData.data?.boards || []
  console.log(`Found ${boards.length} boards in workspace "${targetWorkspace.name}"`)
  
  if (boards.length === 0) {
    console.log('No boards found in workspace')
    return []
  }
  
  // Log board summary
  boards.forEach(board => {
    console.log(`Board: ${board.name} (${board.id}) - ${board.items_page?.items?.length || 0} items`)
  })

  return boards
}

const normalizeStatus = (status: string): string => {
  if (!status) return 'pending'
  
  const statusLower = status.toLowerCase().trim()
  
  // Map common Monday.com status values to database constraint values
  if (statusLower.includes('done') || statusLower.includes('complete')) {
    return 'completed'
  } else if (statusLower.includes('working') || statusLower.includes('progress')) {
    return 'in_progress'
  } else if (statusLower.includes('stuck') || statusLower.includes('cancel')) {
    return 'cancelled'
  } else {
    return 'pending'
  }
}

const processTasksFromBoards = (boards: MondayBoard[], clientId: string) => {
  const processedTasks = []
  const errors = []

  console.log('=== Processing Tasks from Monday.com Boards ===')

  for (const board of boards) {
    console.log(`Processing board: ${board.name} (${board.id})`)
    
    const items = board.items_page?.items || []
    console.log(`Found ${items.length} items in board ${board.name}`)

    for (const item of items) {
      try {
        const columnValues = item.column_values || []
        
        // Extract only essential values
        const statusColumn = columnValues.find(col => col.id === 'status')
        const assigneeColumn = columnValues.find(col => col.id === 'person')
        const dateColumn = columnValues.find(col => col.id === 'date')
        
        const taskName = item.name || 'Untitled Task'
        const status = statusColumn?.text || 'pending'
        const assignee = assigneeColumn?.text || 'Hamilton-wise team'
        const dueDate = dateColumn?.text || null

        console.log(`Processing item: ${taskName}`, { status, assignee, dueDate })

        // Normalize status
        const normalizedStatus = normalizeStatus(status)

        // Determine completion date
        let dateCompleted = null
        if (normalizedStatus === 'completed' || normalizedStatus === 'done') {
          dateCompleted = dueDate || new Date().toISOString()
        }

        // Create task record
        const taskRecord = {
          id: item.id, // Use Monday.com item ID as primary key
          client_id: clientId,
          task_name: taskName,
          status: normalizedStatus,
          date_created: new Date(item.created_at || new Date()).toISOString(),
          date_completed: dateCompleted,
          assignee: assignee,
          airtable_data: { // Keep the field name for compatibility
            board_id: board.id,
            board_name: board.name,
            due_date: dueDate
          },
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        processedTasks.push(taskRecord)

      } catch (itemError) {
        console.error(`Error processing item ${item.id} in board ${board.name}:`, itemError)
        errors.push(`Item ${item.id}: ${itemError.message}`)
      }
    }
  }

  console.log(`=== Processing Complete ===`)
  console.log(`Processed ${processedTasks.length} tasks from ${boards.length} boards`)
  console.log(`Encountered ${errors.length} errors`)

  if (errors.length > 0) {
    console.log('Processing errors:', errors.slice(0, 10)) // Log first 10 errors
  }

  return { processedTasks, errors }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Monday Fetch Tasks Function Called ===')
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

    console.log('Fetching Monday.com tasks for client:', clientId)

    // Get Monday.com credentials
    const credentials = await getMondayCredentials(clientId)
    if (!credentials) {
      return new Response(
        JSON.stringify({ 
          error: 'Monday.com workspace not found for this client. Please reconnect Monday.com in Settings.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { apiToken, workspaceId } = credentials
    console.log('Retrieved credentials for workspace:', workspaceId)

    // Fetch boards from the workspace with timeout handling
    console.log('Fetching boards with 30-second timeout...')
    
    const fetchPromise = fetchWorkspaceBoards(apiToken, workspaceId)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Monday.com API request timed out after 30 seconds')), 30000)
    )
    
    const boards = await Promise.race([fetchPromise, timeoutPromise]) as MondayBoard[]
    
    if (boards.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No boards found in workspace',
          data: { recordsProcessed: 0, recordsStored: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process all tasks from all boards
    const { processedTasks, errors } = processTasksFromBoards(boards, clientId)

    if (processedTasks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No tasks found in workspace boards',
          data: { recordsProcessed: 0, recordsStored: 0, errors: errors.length }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert tasks into Supabase
    console.log(`Upserting ${processedTasks.length} tasks into database...`)
    
    const { data: upsertedTasks, error: upsertError } = await supabase
      .from('client_tasks')
      .upsert(processedTasks, {
        onConflict: 'id' // Use Monday.com item ID for conflict resolution
      })
      .select()

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      throw new Error(`Failed to store tasks: ${upsertError.message}`)
    }

    console.log(`Successfully upserted ${upsertedTasks?.length || 0} tasks`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monday.com sync completed successfully`,
        data: {
          workspaceId: workspaceId,
          boardsProcessed: boards.length,
          recordsProcessed: processedTasks.length,
          recordsStored: upsertedTasks?.length || 0,
          errors: errors.length,
          errorDetails: errors.slice(0, 5) // Include first 5 errors in response
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Monday fetch tasks error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Supabase Edge Function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})