/*
  # Simplify Client Context - Remove Edge Function Dependency

  1. RPC Function
    - `ensure_user_context()` - Returns valid client_id for authenticated user
    - Auto-provisions client if none exists
    - Handles user_profiles and user_clients mapping

  2. Security
    - Uses security definer to bypass RLS for internal operations
    - Maintains RLS policies for direct table access
    - Only authenticated users can call the function
*/

-- Create/ensure tables exist (safe if already present)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_name text NOT NULL DEFAULT 'Default Practice',
  contact_person text NOT NULL DEFAULT 'Unknown',
  email text NOT NULL DEFAULT 'unknown@example.com',
  phone_number text,
  website_url text,
  timezone text DEFAULT 'America/New_York',
  account_status text DEFAULT 'trial' CHECK (account_status IN ('active', 'suspended', 'trial', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tasks_client_id text
);

CREATE TABLE IF NOT EXISTS public.user_clients (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_clients TO authenticated;

-- RLS Policies
DROP POLICY IF EXISTS "clients_select_linked" ON public.clients;
CREATE POLICY "clients_select_linked"
  ON public.clients FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_clients uc
    WHERE uc.client_id = clients.id AND uc.user_id = auth.uid()
  ));

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

-- RPC: ensure_user_context – returns a valid client_id for auth.uid()
-- If none exists, creates one client + mapping and stores as default.
DROP FUNCTION IF EXISTS public.ensure_user_context CASCADE;
CREATE FUNCTION public.ensure_user_context()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  cid uuid;
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Get user email for better client naming
  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  -- 1) Try default_client_id from user_profiles
  SELECT default_client_id INTO cid
  FROM public.user_profiles
  WHERE user_id = uid;

  IF cid IS NOT NULL THEN
    -- Verify linkage still exists
    IF EXISTS (SELECT 1 FROM public.user_clients WHERE user_id = uid AND client_id = cid) THEN
      RETURN cid;
    END IF;
  END IF;

  -- 2) Try first linked client
  SELECT client_id INTO cid
  FROM public.user_clients
  WHERE user_id = uid
  ORDER BY created_at ASC
  LIMIT 1;

  IF cid IS NOT NULL THEN
    -- Update profile to use this client as default
    INSERT INTO public.user_profiles(user_id, default_client_id)
    VALUES (uid, cid)
    ON CONFLICT (user_id) DO UPDATE SET 
      default_client_id = EXCLUDED.default_client_id, 
      updated_at = now();
    RETURN cid;
  END IF;

  -- 3) Auto-provision new client
  INSERT INTO public.clients(
    practice_name, 
    contact_person, 
    email,
    account_status
  ) VALUES (
    COALESCE(user_email || '''s Practice', 'Default Practice'),
    COALESCE(user_email, 'Unknown'),
    COALESCE(user_email, 'unknown@example.com'),
    'trial'
  )
  RETURNING id INTO cid;

  -- Link user to new client
  INSERT INTO public.user_clients(user_id, client_id, role) 
  VALUES (uid, cid, 'owner');

  -- Set as default in user_profiles
  INSERT INTO public.user_profiles(user_id, default_client_id)
  VALUES (uid, cid)
  ON CONFLICT (user_id) DO UPDATE SET 
    default_client_id = EXCLUDED.default_client_id, 
    updated_at = now();

  RETURN cid;
END $$;

-- Allow authenticated users to execute the RPC
GRANT EXECUTE ON FUNCTION public.ensure_user_context() TO authenticated;