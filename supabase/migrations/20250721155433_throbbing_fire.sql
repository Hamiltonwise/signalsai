/*
  # Multi-Platform Integration Database Schema

  1. New Tables
    - `users` - User authentication and role management
    - `integration_accounts` - Secure storage for API credentials
    - `gbp_metrics` - Google Business Profile performance data
    - `gsc_metrics` - Google Search Console search performance data
    - `clarity_metrics` - Microsoft Clarity user experience data
    - `pms_data` - Practice Management System referral data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and service role access
    - Ensure proper client data isolation

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for dashboard queries and reporting
*/

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Integration accounts for secure credential storage
CREATE TABLE IF NOT EXISTS integration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ga4', 'gbp', 'gsc', 'clarity')),
  account_name text,
  encrypted_credentials jsonb NOT NULL,
  connection_status text NOT NULL DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'error', 'disconnected')),
  last_sync timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- Google Business Profile metrics
CREATE TABLE IF NOT EXISTS gbp_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  location_name text,
  total_views integer DEFAULT 0,
  search_views integer DEFAULT 0,
  maps_views integer DEFAULT 0,
  phone_calls integer DEFAULT 0,
  website_clicks integer DEFAULT 0,
  direction_requests integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  new_reviews integer DEFAULT 0,
  total_photos integer DEFAULT 0,
  new_photos integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  posts_created integer DEFAULT 0,
  calculated_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, date, location_name)
);

-- Google Search Console metrics
CREATE TABLE IF NOT EXISTS gsc_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  query text,
  page text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric(5,4) DEFAULT 0,
  position numeric(5,2) DEFAULT 0,
  country text DEFAULT 'USA',
  device text DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  calculated_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Microsoft Clarity metrics
CREATE TABLE IF NOT EXISTS clarity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_sessions integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  page_views integer DEFAULT 0,
  avg_session_duration numeric(10,2) DEFAULT 0,
  bounce_rate numeric(5,4) DEFAULT 0,
  dead_clicks integer DEFAULT 0,
  rage_clicks integer DEFAULT 0,
  quick_backs integer DEFAULT 0,
  excessive_scrolling integer DEFAULT 0,
  javascript_errors integer DEFAULT 0,
  calculated_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, date)
);

-- Practice Management System data
CREATE TABLE IF NOT EXISTS pms_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  referral_type text NOT NULL CHECK (referral_type IN ('doctor_referral', 'self_referral', 'insurance_referral', 'emergency', 'other')),
  referral_source text,
  patient_count integer DEFAULT 1,
  revenue_amount numeric(10,2) DEFAULT 0,
  appointment_type text,
  treatment_category text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_data ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can manage all users"
  ON users
  FOR ALL
  TO service_role
  USING (true);

-- Integration accounts policies
CREATE POLICY "Users can read own client integrations"
  ON integration_accounts
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients 
    WHERE auth.uid()::text = clients.id::text
  ));

CREATE POLICY "Service role can manage all integrations"
  ON integration_accounts
  FOR ALL
  TO service_role
  USING (true);

-- GBP metrics policies
CREATE POLICY "Users can read own client gbp_metrics"
  ON gbp_metrics
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients 
    WHERE auth.uid()::text = clients.id::text
  ));

CREATE POLICY "Service role can manage all gbp_metrics"
  ON gbp_metrics
  FOR ALL
  TO service_role
  USING (true);

-- GSC metrics policies
CREATE POLICY "Users can read own client gsc_metrics"
  ON gsc_metrics
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients 
    WHERE auth.uid()::text = clients.id::text
  ));

CREATE POLICY "Service role can manage all gsc_metrics"
  ON gsc_metrics
  FOR ALL
  TO service_role
  USING (true);

-- Clarity metrics policies
CREATE POLICY "Users can read own client clarity_metrics"
  ON clarity_metrics
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients 
    WHERE auth.uid()::text = clients.id::text
  ));

CREATE POLICY "Service role can manage all clarity_metrics"
  ON clarity_metrics
  FOR ALL
  TO service_role
  USING (true);

-- PMS data policies
CREATE POLICY "Users can read own client pms_data"
  ON pms_data
  FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients 
    WHERE auth.uid()::text = clients.id::text
  ));

CREATE POLICY "Service role can manage all pms_data"
  ON pms_data
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_integration_accounts_client_id ON integration_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_integration_accounts_platform ON integration_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_integration_accounts_status ON integration_accounts(connection_status);

CREATE INDEX IF NOT EXISTS idx_gbp_metrics_client_id ON gbp_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_gbp_metrics_date ON gbp_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gbp_metrics_score ON gbp_metrics(calculated_score);
CREATE INDEX IF NOT EXISTS idx_gbp_metrics_location ON gbp_metrics(location_name);

CREATE INDEX IF NOT EXISTS idx_gsc_metrics_client_id ON gsc_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_date ON gsc_metrics(date);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_query ON gsc_metrics(query);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_page ON gsc_metrics(page);
CREATE INDEX IF NOT EXISTS idx_gsc_metrics_score ON gsc_metrics(calculated_score);

CREATE INDEX IF NOT EXISTS idx_clarity_metrics_client_id ON clarity_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_clarity_metrics_date ON clarity_metrics(date);
CREATE INDEX IF NOT EXISTS idx_clarity_metrics_score ON clarity_metrics(calculated_score);

CREATE INDEX IF NOT EXISTS idx_pms_data_client_id ON pms_data(client_id);
CREATE INDEX IF NOT EXISTS idx_pms_data_date ON pms_data(date);
CREATE INDEX IF NOT EXISTS idx_pms_data_referral_type ON pms_data(referral_type);