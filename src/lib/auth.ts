import { supabase } from './supabaseClient';

const STORAGE_KEYS = [
  // primary app storageKey (keep aligned with your supabase client config)
  'app-auth',
  // legacy supabase-js keys (safe to clear if present)
  // Example: `sb-<project-ref>-auth-token` (use a prefix clear)
];

function clearLegacySupabaseKeys() {
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k === 'app-auth') continue; // handled below
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

export async function signOutEverywhere() {
  // 1) ask supabase to sign out (server state)
  try { await supabase.auth.signOut(); } catch {}

  // 2) clear client storage (local "remembered" tokens)
  try {
    localStorage.removeItem('app-auth');
    clearLegacySupabaseKeys();
    sessionStorage.removeItem('app-auth');
  } catch {}

  // 3) as a final guard, broadcast an internal event
  try { window.dispatchEvent(new CustomEvent('app:signed-out')); } catch {}
}