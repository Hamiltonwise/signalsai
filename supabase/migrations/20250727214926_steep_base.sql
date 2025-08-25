/*
  # Create client_tasks table for Airtable task synchronization

  1. New Tables
    - `client_tasks`
      - `id` (text, primary key) - Airtable record ID
      - `client_id` (uuid, foreign key) - References clients table
      - `task_name` (text) - Task description from Airtable
      - `status` (text) - Task status (pending, in_progress, completed)
      - `date_created` (timestamptz) - When task was created
      - `date_completed` (timestamptz, nullable) - When task was completed
      - `assignee` (text) - Who is assigned (default: Hamilton-wise team)
      - `airtable_data` (jsonb, nullable) - Raw Airtable data for reference
      - `last_synced_at` (timestamptz) - Last sync timestamp
      - `created_at` (timestamptz) - Record creation in Supabase
      - `updated_at` (timestamptz) - Record update in Supabase

  2. Security
    - Enable RLS on `client_tasks` table
    - Add policy for authenticated users to read their own client's tasks
    - Add policy for service role to manage all tasks (for sync operations)

  3. Indexes
    - Index on client_id for efficient filtering
    - Index on status for status-based queries
    - Index on date_created for chronological sorting
    - Index on last_synced_at for sync operations
*/

-- Create client_tasks table
CREATE TABLE IF NOT EXISTS client_tasks (
  id text PRIMARY KEY, -- Airtable record ID
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  date_created timestamptz NOT NULL,
  date_completed timestamptz,
  assignee text NOT NULL DEFAULT 'Hamilton-wise team',
  airtable_data jsonb, -- Store raw Airtable data for reference
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for valid status values
ALTER TABLE client_tasks 
ADD CONSTRAINT client_tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'done', 'cancelled'));

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_date_created ON client_tasks(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_client_tasks_last_synced ON client_tasks(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_client_tasks_date_completed ON client_tasks(date_completed DESC) WHERE date_completed IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read tasks for their own client
CREATE POLICY "Users can read own client tasks"
  ON client_tasks
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT clients.id 
      FROM clients 
      WHERE (auth.uid())::text = (clients.id)::text
    )
  );

-- Policy: Service role can manage all tasks (for Airtable sync)
CREATE POLICY "Service role can manage all client tasks"
  ON client_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER client_tasks_updated_at_trigger
  BEFORE UPDATE ON client_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_client_tasks_updated_at();