/*
  # Create API credentials table

  1. New Tables
    - `api_credentials`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `service_name` (enum: gbp, ga4, gsc, clarity)
      - `credential_type` (enum: oauth_token, api_key, refresh_token, access_token)
      - `encrypted_value` (text, encrypted credential data)
      - `expiration_date` (timestamp, optional)
      - `metadata` (jsonb, optional additional data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_credentials` table
    - Add policies for service role access only
*/

CREATE TYPE service_name_enum AS ENUM ('gbp', 'ga4', 'gsc', 'clarity');
CREATE TYPE credential_type_enum AS ENUM ('oauth_token', 'api_key', 'refresh_token', 'access_token');

CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_name service_name_enum NOT NULL,
  credential_type credential_type_enum NOT NULL,
  encrypted_value text NOT NULL,
  expiration_date timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role can access credentials for security
CREATE POLICY "Service role can manage all credentials"
  ON api_credentials
  FOR ALL
  TO service_role
  USING (true);

-- Create unique index to prevent duplicate credentials
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_credentials_unique 
  ON api_credentials(client_id, service_name, credential_type);

-- Create index for client lookups
CREATE INDEX IF NOT EXISTS idx_api_credentials_client_id ON api_credentials(client_id);

-- Create index for service lookups
CREATE INDEX IF NOT EXISTS idx_api_credentials_service ON api_credentials(service_name);