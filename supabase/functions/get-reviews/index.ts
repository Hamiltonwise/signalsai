import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, x-client-id',
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

  console.log('=== Get Reviews Function Called ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    let clientId = url.searchParams.get('clientId') || 
                   req.headers.get('x-client-id') || 
                   null

    // If no clientId provided, try to infer from active connections
    if (!clientId) {
      console.log('No clientId provided, attempting to infer from active connections')
      
      const { data: activeConnections, error: connectionsError } = await supabase
        .from('integration_accounts')
        .select('client_id, created_at')
        .eq('connection_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!connectionsError && activeConnections && activeConnections.length > 0) {
        clientId = activeConnections[0].client_id
        console.log('Inferred clientId from active connection:', clientId)
      }
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'No clientId provided and no active connections found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const limit = url.searchParams.get('limit')
    const effectiveness = url.searchParams.get('effectiveness')
    const sentiment = url.searchParams.get('sentiment')


    console.log('Fetching reviews for client:', clientId)

    // Build query
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('client_id', clientId)
      .order('ai_score', { ascending: false })

    // Apply filters
    if (effectiveness) {
      query = query.eq('effectiveness_rating', effectiveness)
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    console.log(`Found ${reviews?.length || 0} reviews`)

    // Calculate summary metrics
    const metrics = reviews && reviews.length > 0 ? {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      averageAIScore: reviews.reduce((sum, r) => sum + r.ai_score, 0) / reviews.length,
      highEffectivenessCount: reviews.filter(r => r.effectiveness_rating === 'high').length,
      pendingResponsesCount: reviews.filter(r => r.response_status === 'pending').length
    } : null

    return new Response(
      JSON.stringify({
        success: true,
        data: reviews || [],
        metrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})