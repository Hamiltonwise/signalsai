/*
  # Create GA4 metrics table

  1. New Tables
    - `ga4_metrics`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `date` (date, the date for these metrics)
      - `new_users` (integer, new users count)
      - `total_users` (integer, total users count)
      - `sessions` (integer, total sessions)
      - `engagement_rate` (decimal, engagement rate 0-1)
      - `conversions` (integer, total conversions)
      - `avg_session_duration` (decimal, average session duration in seconds)
      - `bounce_rate` (decimal, bounce rate 0-1)
      - `pages_per_session` (decimal, average pages per session)
      - `calculated_score` (integer, calculated performance score 0-100)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ga4_metrics` table
    - Add policies for service role access
*/

CREATE TABLE IF NOT EXISTS ga4_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  new_users integer DEFAULT 0,
  total_users integer DEFAULT 0,
  sessions integer DEFAULT 0,
  engagement_rate decimal(5,4) DEFAULT 0,
  conversions integer DEFAULT 0,
  avg_session_duration decimal(10,2) DEFAULT 0,
  bounce_rate decimal(5,4) DEFAULT 0,
  pages_per_session decimal(5,2) DEFAULT 0,
  calculated_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ga4_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can manage all metrics
CREATE POLICY "Service role can manage all ga4_metrics"
  ON ga4_metrics
  FOR ALL
  TO service_role
  USING (true);

-- Authenticated users can read metrics for their clients
CREATE POLICY "Users can read own client ga4_metrics"
  ON ga4_metrics
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid()::text = id::text
    )
  );

-- Create unique index to prevent duplicate date entries per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_ga4_metrics_client_date 
  ON ga4_metrics(client_id, date);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_ga4_metrics_date ON ga4_metrics(date);

-- Create index for client lookups
CREATE INDEX IF NOT EXISTS idx_ga4_metrics_client_id ON ga4_metrics(client_id);

-- Create index for score queries
CREATE INDEX IF NOT EXISTS idx_ga4_metrics_score ON ga4_metrics(calculated_score);