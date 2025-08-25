/*
  # Client Resolution System

  1. New Tables
    - `user_clients` - Maps users to clients they can access
    - `user_profiles` - Stores user's default client selection
  
  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control
    - Ensure users can only see clients they're mapped to
  
  3. Changes
    - Canonical client mapping system
    - Server-side client resolution for OAuth flows
*/

-- Canonical tables (create if missing)
CREATE TABLE IF NOT EXISTS public.user_clients (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id)
);

-- Optional profile table that can store the user's default client
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS + grants
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

GRANT usage ON schema public TO anon, authenticated, service_role;
GRANT select ON public.clients TO authenticated;
GRANT select, insert, update ON public.user_profiles TO authenticated;
GRANT select, insert, delete ON public.user_clients TO authenticated;

-- Policies: user can see clients linked via user_clients
DROP POLICY IF EXISTS "clients_select_linked" ON public.clients;
CREATE POLICY "clients_select_linked"
  ON public.clients FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_clients uc
    WHERE uc.client_id = clients.id AND uc.user_id = auth.uid()
  ));

-- Policies: user can see/insert/delete own mappings
DROP POLICY IF EXISTS "user_clients_select_own" ON public.user_clients;
CREATE POLICY "user_clients_select_own"
  ON public.user_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_clients_insert_own" ON public.user_clients;
CREATE POLICY "user_clients_insert_own"
  ON public.user_clients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_clients_delete_own" ON public.user_clients;
CREATE POLICY "user_clients_delete_own"
  ON public.user_clients FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Policies: user_profiles (read/write own profile)
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_upsert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_upsert_own"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());