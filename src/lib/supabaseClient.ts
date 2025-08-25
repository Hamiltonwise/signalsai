import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// FIXED storageKey so every code path uses the SAME session bucket
let STORAGE_KEY: string;
try {
  STORAGE_KEY = `sb-${new URL(SUPABASE_URL).host.split('.')[0]}-auth-token`;
} catch (error) {
  console.error('[supabase] Invalid SUPABASE_URL, using fallback storage key');
  STORAGE_KEY = 'sb-fallback-auth-token';
}

// HMR-safe singleton cache
const GLOBAL_KEY = '__supabase_singleton__';
type GlobalWithSB = typeof globalThis & { [GLOBAL_KEY]?: SupabaseClient };
const g = globalThis as GlobalWithSB;

export const supabase: SupabaseClient =
  g[GLOBAL_KEY] ??
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: STORAGE_KEY,
    },
  });

// Cache for HMR
g[GLOBAL_KEY] = supabase;

// Log environment validation (don't crash render)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[env] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY - UI will show degraded experience');
}

export default supabase;