// ──────────────────────────────────────────────────────────────────────────────
// ForestGuard AI — Supabase Client Configuration
// Replace the placeholder values with your actual Supabase project credentials.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pxzxzlnyiblgvqplhiot.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5I4ND2maWivsRKyDwjX_2Q_VcYOHnnx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase is properly configured (not using placeholder values).
 */
export function isSupabaseConfigured() {
  return (
    supabaseUrl !== 'https://YOUR_PROJECT.supabase.co' &&
    supabaseAnonKey !== 'YOUR_ANON_KEY' &&
    supabaseUrl.includes('supabase.co')
  );
}
