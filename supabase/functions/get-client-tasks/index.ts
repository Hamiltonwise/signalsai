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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== Get Client Tasks Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    // Accept both GET and POST methods
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use GET or POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract parameters from URL query string for GET requests or body for POST
    let clientId: string
    let status: string | undefined
    let limit: number | undefined

    if (req.method === 'GET') {
      const url = new URL(req.url)
      clientId = url.searchParams.get('clientId') || ''
      status = url.searchParams.get('status') || undefined
      const limitParam = url.searchParams.get('limit')
      limit = limitParam ? parseInt(limitParam) : undefined
    } else {
      // POST method
      const body = await req.json()
      clientId = body.clientId || ''
      status = body.status
      limit = body.limit
    }

    console.log('Parameters:', { clientId, status, limit })

    if (!clientId) {
      console.log('Missing required parameter: clientId')
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build query
    let query = supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('date_created', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: tasks, error: tasksError } = await query

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
    }

    console.log(`Found ${tasks?.length || 0} tasks for client ${clientId}`)

    // Calculate summary statistics
    const allTasksQuery = await supabase
      .from('client_tasks')
      .select('status, date_completed')
      .eq('client_id', clientId)

    const { data: allTasks, error: summaryError } = allTasksQuery

    if (summaryError) {
      console.error('Error fetching task summary:', summaryError)
      throw new Error(`Failed to fetch task summary: ${summaryError.message}`)
    }

    const summary = {
      total: allTasks?.length || 0,
      completed: allTasks?.filter(t => t.status === 'completed' || t.status === 'done').length || 0,
      in_progress: allTasks?.filter(t => t.status === 'in_progress').length || 0,
      pending: allTasks?.filter(t => t.status === 'pending').length || 0,
      cancelled: allTasks?.filter(t => t.status === 'cancelled').length || 0
    }

    // Calculate recent completions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentCompleted = allTasks?.filter(t => 
      (t.status === 'completed' || t.status === 'done') && 
      t.date_completed && 
      new Date(t.date_completed) >= thirtyDaysAgo
    ).length || 0

    // Get last sync time
    const lastSyncTime = tasks && tasks.length > 0 
      ? tasks.reduce((latest, task) => {
          const syncTime = new Date(task.last_synced_at)
          return syncTime > latest ? syncTime : latest
        }, new Date(0)).toISOString()
      : null

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tasks: tasks || [],
          summary,
          recentCompleted,
          lastSyncTime
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-client-tasks function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Supabase Edge Function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})