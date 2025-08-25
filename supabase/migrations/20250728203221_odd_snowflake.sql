/*
  # Create AI Insights Table

  1. New Tables
    - `ai_insights`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `report_date` (date)
      - `priority_opportunities` (jsonb array)
      - `recent_wins` (jsonb array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_insights` table
    - Add policy for service role to manage all insights
    - Add policy for authenticated users to read their own client insights

  3. Indexes
    - Index on client_id for faster queries
    - Unique index on client_id + report_date to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  priority_opportunities jsonb DEFAULT '[]'::jsonb,
  recent_wins jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_client_id ON ai_insights USING btree (client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_insights_client_report_date ON ai_insights USING btree (client_id, report_date);

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage all AI insights"
  ON ai_insights
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own client AI insights"
  ON ai_insights
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id
    FROM clients
    WHERE (auth.uid())::text = (clients.id)::text
  ));