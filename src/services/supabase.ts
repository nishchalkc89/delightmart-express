import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/*
 * Delight's own Supabase project.
 *
 * Uses VITE_DELIGHT_SUPABASE_URL / VITE_DELIGHT_SUPABASE_ANON_KEY so the app always talks to the
 * store's external project, even if a hosting platform injects its own VITE_SUPABASE_* values.
 * Both values are public (browser) values; security is enforced by row-level security.
 */
const url = import.meta.env['VITE_DELIGHT_SUPABASE_URL'] as string | undefined;
const key = import.meta.env['VITE_DELIGHT_SUPABASE_ANON_KEY'] as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn('[Delight] VITE_DELIGHT_SUPABASE_URL / VITE_DELIGHT_SUPABASE_ANON_KEY are not set. The store runs on demo data until they are added to .env.');
}

export const supabase = createClient<Database>(url || 'https://not-configured.supabase.co', key || 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
