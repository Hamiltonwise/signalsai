import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Create admin client for user management
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Create regular client for database operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const {
      client_id,
      practice_name,
      contact_person,
      email,
      phone_number,
      website_url,
      password,
      first_name,
      last_name,
      timezone = 'America/New_York'
    } = await req.json()

    // Validate required fields
    if (!practice_name || !contact_person || !email || !password || !first_name || !last_name) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: practice_name, contact_person, email, password, first_name, last_name'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists in auth.users
    const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authCheckError) {
      console.error('Error checking existing auth users:', authCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const emailExists = existingAuthUser.users.some(user => user.email === email)
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Also check if email already exists in custom users table
    const { data: existingCustomUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingCustomUser) {
      console.error('Registration failed: Email already exists:', email)
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also check if client with this email already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single()

    if (existingClient) {
      console.error('Registration failed: Client with email already exists:', email)
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided client_id or generate new one
    const clientId = client_id || crypto.randomUUID()

    console.log('Creating user in Supabase auth.users table...')
    
    // Create user in Supabase's native auth.users table first
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email to avoid confirmation flow
      user_metadata: {
        first_name,
        last_name,
        practice_name,
        client_id: clientId
      }
    })
    
    if (authUserError) {
      console.error('Auth user creation error:', authUserError)
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Auth user created successfully:', authUser.user.id)

    // Create client first
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        id: clientId,
        practice_name,
        contact_person,
        email,
        phone_number,
        website_url,
        timezone,
        account_status: 'trial'
      })
      .select()
      .single()

    if (clientError) {
      // Cleanup: delete the auth user if client creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      console.error('Client creation error:', clientError)
      return new Response(
        JSON.stringify({ error: `Failed to create client: ${clientError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin user in custom users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id, // Use the same ID as auth.users
        client_id: client.id,
        email,
        password_hash: 'managed_by_supabase_auth', // Placeholder since auth.users handles passwords
        first_name,
        last_name,
        role: 'admin'
      })
      .select()
      .single()

    if (userError) {
      // Cleanup: delete both the client and auth user if custom user creation fails
      await supabase.from('clients').delete().eq('id', client.id)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      console.error('User creation error:', userError)
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${userError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Registration completed successfully for:', email)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            full_name: `${user.first_name} ${user.last_name}`
          },
          client: {
            id: client.id,
            practice_name: client.practice_name,
            account_status: client.account_status
          },
          auth_user: {
            id: authUser.user.id,
            email: authUser.user.email
          }
        },
        message: 'Registration successful. You can now sign in with your email and password.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})