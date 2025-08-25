/*
  # OAuth States Table for Secure State Management

  1. New Tables
    - `oauth_states`
      - `state` (uuid, primary key) - secure UUID state parameter
      - `user_id` (uuid, foreign key) - authenticated user initiating OAuth
      - `client_id` (uuid, foreign key) - optional client association
      - `provider` (text) - OAuth provider name (ga4, gsc, gbp, etc.)
      - `created_at` (timestamp) - when state was created
      - `expires_at` (timestamp) - automatic cleanup after 15 minutes

  2. Security
    - Enable RLS on `oauth_states` table
    - Add policy for service role to manage all states
    - Add cleanup index for expired states

  3. Purpose
    - Maps secure UUID states to real user/client UUIDs
    - Prevents "invalid input syntax for type uuid" errors
    - Enables proper OAuth flow with temporary state management
*/

CREATE TABLE IF NOT EXISTS public.oauth_states (
  state uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all oauth states"
  ON public.oauth_states
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires 
  ON public.oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider 
  ON public.oauth_states(user_id, provider);

-- Optional: Create cleanup function for expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;