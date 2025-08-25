import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('resolve-client: Starting function execution')
    
    // Create Supabase client with service role for RPC access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('resolve-client: Missing environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: req.headers.get('authorization') || ''
        }
      }
    })

    // Get current user from the request context
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('resolve-client: Auth error:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('resolve-client: User verified:', user.id)

    // Check if user already has a client_id in user_profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('default_client_id')
      .eq('user_id', user.id)
      .single()

    if (!profileError && existingProfile?.default_client_id) {
      console.log('resolve-client: Found existing client_id in profile:', existingProfile.default_client_id)
      
      // Verify the client still exists
      const { data: existingClient, error: clientError } = await supabase
        .from('clients')
        .select('id, practice_name, account_status')
        .eq('id', existingProfile.default_client_id)
        .single()

      if (!clientError && existingClient) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              client_id: existingClient.id,
              clients: [existingClient],
              source: 'existing_profile'
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Check if a client already exists with this user's email
    const userEmail = user.email || user.user_metadata?.email
    if (!userEmail) {
      console.error('resolve-client: No email found for user')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User email not found'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('resolve-client: Looking for existing client with email:', userEmail)

    const { data: existingClient, error: existingClientError } = await supabase
      .from('clients')
      .select('id, practice_name, account_status, email')
      .eq('email', userEmail)
      .single()

    if (existingClient && !existingClientError) {
      console.log('resolve-client: Found existing client:', existingClient.id)
      
      // Create user_clients mapping if it doesn't exist
      const { error: linkError } = await supabase
        .from('user_clients')
        .upsert({
          user_id: user.id,
          client_id: existingClient.id,
          role: 'owner'
        }, {
          onConflict: 'user_id,client_id'
        })

      if (linkError) {
        console.log('resolve-client: Note - user_clients link may already exist:', linkError.message)
      }

      // Update user profile with default client
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          default_client_id: existingClient.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            client_id: existingClient.id,
            clients: [existingClient],
            source: 'existing_client'
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // No existing client found, create a new one
    console.log('resolve-client: No existing client found, creating new client')
    
    const newClientData = {
      practice_name: user.user_metadata?.practice_name || `${userEmail.split('@')[0]}'s Practice`,
      contact_person: user.user_metadata?.contact_person || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || userEmail,
      email: userEmail,
      phone_number: user.user_metadata?.phone_number || null,
      website_url: user.user_metadata?.website_url || null,
      timezone: user.user_metadata?.timezone || 'America/New_York',
      account_status: 'trial'
    }

    console.log('resolve-client: Creating client with data:', newClientData)

    // Try to create new client, handle duplicate email constraint
    let newClient
    try {
      const { data, error: createClientError } = await supabase
        .from('clients')
        .insert(newClientData)
        .select()
        .single()

      if (createClientError) {
        throw createClientError
      }
      
      newClient = data
      console.log('resolve-client: Created new client:', newClient.id)
      
    } catch (createClientError) {
      console.error('resolve-client: Error creating client:', createClientError)
      
      // Handle duplicate email constraint specifically
      if (createClientError.code === '23505' && createClientError.message.includes('clients_email_key')) {
        console.log('resolve-client: Duplicate email detected, finding existing client')
        
        const { data: duplicateClient, error: findError } = await supabase
          .from('clients')
          .select('id, practice_name, account_status, email')
          .eq('email', userEmail)
          .single()

        if (duplicateClient && !findError) {
          console.log('resolve-client: Found existing client, linking user:', duplicateClient.id)
          
          // Link user to existing client
          const { error: linkError } = await supabase
            .from('user_clients')
            .upsert({
              user_id: user.id,
              client_id: duplicateClient.id,
              role: 'owner'
            }, {
              onConflict: 'user_id,client_id'
            })

          if (linkError) {
            console.log('resolve-client: Note - user_clients link may already exist:', linkError.message)
          }

          // Update user profile
          await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              default_client_id: duplicateClient.id,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                client_id: duplicateClient.id,
                clients: [duplicateClient],
                source: 'duplicate_resolved'
              }
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          console.error('resolve-client: Could not find duplicate client:', findError)
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Email already exists but could not locate existing client'
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
      
      // Handle other creation errors
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create client: ${createClientError.message}`
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('resolve-client: Created new client:', newClient.id)

    // Link user to the new client
    const { error: linkError } = await supabase
      .from('user_clients')
      .insert({
        user_id: user.id,
        client_id: newClient.id,
        role: 'owner'
      })

    if (linkError) {
      console.log('resolve-client: Note - user_clients link error (may already exist):', linkError.message)
    }

    // Create user profile with default client
    const { error: profileCreateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        default_client_id: newClient.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (profileCreateError) {
      console.log('resolve-client: Note - profile creation error:', profileCreateError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          client_id: newClient.id,
          clients: [newClient],
          source: 'new_client'
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('resolve-client: Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Server error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})