/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `practice_name` (text, required)
      - `contact_person` (text, required)
      - `email` (text, unique, required)
      - `phone_number` (text, optional)
      - `website_url` (text, optional)
      - `timezone` (text, default 'America/New_York')
      - `account_status` (enum: active, suspended, trial, cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policy for authenticated users to read their own data
*/

CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'trial', 'cancelled');

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_name text NOT NULL,
  contact_person text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  website_url text,
  timezone text DEFAULT 'America/New_York',
  account_status account_status_enum DEFAULT 'trial',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Service role can manage all clients"
  ON clients
  FOR ALL
  TO service_role
  USING (true);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Create index for account status
CREATE INDEX IF NOT EXISTS idx_clients_account_status ON clients(account_status);