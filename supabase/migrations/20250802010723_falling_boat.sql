/*
  # OAuth States RLS Policies

  1. Table Grants
    - Grant necessary permissions to authenticated and service_role users
    - Enable Row Level Security on oauth_states table

  2. RLS Policies
    - Allow authenticated users to insert their own state rows
    - Allow authenticated users to select/delete their own rows
    - Service role bypasses RLS automatically

  3. Security
    - Users can only access their own oauth state rows
    - Service role (oauth-callback) can access all rows for token exchange
*/

-- Ensure schema usage grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Explicit table grants (RLS still applies; grants alone are not enough)
GRANT SELECT, INSERT, DELETE ON public.oauth_states TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oauth_states TO service_role;

-- Enable RLS (safe if already enabled)
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated user to INSERT their own row
DROP POLICY IF EXISTS "oauth_states_insert_own" ON public.oauth_states;
CREATE POLICY "oauth_states_insert_own"
  ON public.oauth_states
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: allow authenticated user to SELECT their own rows
DROP POLICY IF EXISTS "oauth_states_select_own" ON public.oauth_states;
CREATE POLICY "oauth_states_select_own"
  ON public.oauth_states
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: allow authenticated user to DELETE their own rows (cleanup)
DROP POLICY IF EXISTS "oauth_states_delete_own" ON public.oauth_states;
CREATE POLICY "oauth_states_delete_own"
  ON public.oauth_states
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role bypasses RLS automatically, no additional policies needed