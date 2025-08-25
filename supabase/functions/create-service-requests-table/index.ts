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

  console.log('=== Create Service Requests Table Function Called ===')

  try {
    // Create the enums first
    console.log('Creating enums...')
    
    await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE IF NOT EXISTS service_request_type_enum AS ENUM ('website_change', 'promotion', 'other');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    })

    await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE IF NOT EXISTS service_request_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    })

    // Create the table
    console.log('Creating service_requests table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS service_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text NOT NULL,
        request_type service_request_type_enum NOT NULL DEFAULT 'other',
        status service_request_status_enum NOT NULL DEFAULT 'pending',
        monday_item_id text,
        monday_board_id text,
        created_by_email text NOT NULL,
        created_by_name text NOT NULL,
        date_completed timestamptz,
        last_synced_at timestamptz DEFAULT now(),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (tableError) {
      console.error('Error creating table:', tableError)
      throw new Error(`Failed to create table: ${tableError.message}`)
    }

    // Create indexes
    console.log('Creating indexes...')
    
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON service_requests(client_id);
      CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
      CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_service_requests_monday_item ON service_requests(monday_item_id) WHERE monday_item_id IS NOT NULL;
    `

    await supabase.rpc('exec_sql', { sql: indexSQL })

    // Enable RLS
    console.log('Enabling RLS...')
    
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;'
    })

    // Create RLS policies
    console.log('Creating RLS policies...')
    
    const policiesSQL = `
      CREATE POLICY IF NOT EXISTS "Users can read own client service requests"
        ON service_requests
        FOR SELECT
        TO authenticated
        USING (client_id IN (
          SELECT clients.id
          FROM clients
          WHERE (auth.uid())::text = (clients.id)::text
        ));

      CREATE POLICY IF NOT EXISTS "Users can create service requests for own client"
        ON service_requests
        FOR INSERT
        TO authenticated
        WITH CHECK (client_id IN (
          SELECT clients.id
          FROM clients
          WHERE (auth.uid())::text = (clients.id)::text
        ));

      CREATE POLICY IF NOT EXISTS "Service role can manage all service requests"
        ON service_requests
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    `

    await supabase.rpc('exec_sql', { sql: policiesSQL })

    // Create update trigger
    console.log('Creating update trigger...')
    
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_service_requests_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS service_requests_updated_at_trigger ON service_requests;
      CREATE TRIGGER service_requests_updated_at_trigger
        BEFORE UPDATE ON service_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_service_requests_updated_at();
    `

    await supabase.rpc('exec_sql', { sql: triggerSQL })

    console.log('Service requests table created successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Service requests table created successfully',
        data: {
          tableCreated: true,
          rlsEnabled: true,
          policiesCreated: true,
          indexesCreated: true,
          triggerCreated: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating service requests table:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})