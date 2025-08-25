const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, content-language, x-forwarded-for',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  console.log('=== GBP Auth Function Called ===')
  console.log('Method:', req.method)
  console.log('Origin:', req.headers.get('origin'))
  console.log('URL:', req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight for GBP auth')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with anon key (will use RLS with user's token)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_ANON_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('authorization') || ''
        }
      }
    })

    // Get current user from the request context
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired token'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User verified:', user.id)

    // Use RPC to ensure user has a client_id
    const { data: clientId, error: rpcError } = await supabase
      .rpc('ensure_user_context')

    if (rpcError || !clientId) {
      console.error('RPC error:', rpcError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to resolve client: ${rpcError?.message || 'No client ID returned'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Client resolved via RPC:', clientId)

    const googleClientId = Deno.env.get('GOOGLE_GBP_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_GBP_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials')
      return new Response(
        JSON.stringify({ 
          error: 'Missing Google OAuth environment variables. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase Edge Functions environment variables.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redirectUri = `${supabaseUrl}/functions/v1/gbp-callback`
    const scopes = [
      'https://www.googleapis.com/auth/business.manage'
    ].join(' ')
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(clientId)}`

    console.log('GBP auth URL generated successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        authUrl,
        redirectUri,
        clientId,
        message: 'GBP auth URL generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('GBP Auth error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})