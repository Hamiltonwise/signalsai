/*
  # Add tasks_client_id column to clients table

  1. Schema Changes
    - Add `tasks_client_id` column to `clients` table
    - Column is nullable text type for storing Airtable client identifiers
    
  2. Purpose
    - Enables precise mapping between Supabase clients and Airtable tasks
    - Allows manual configuration of client-task relationships
    - Eliminates ambiguity in task assignment during sync operations
*/

-- Add tasks_client_id column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'tasks_client_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN tasks_client_id text;
  END IF;
END $$;

-- Add index for efficient lookups during task sync
CREATE INDEX IF NOT EXISTS idx_clients_tasks_client_id ON clients(tasks_client_id) WHERE tasks_client_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN clients.tasks_client_id IS 'Unique identifier from Airtable used to map tasks to this client during sync operations';