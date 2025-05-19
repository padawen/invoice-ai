import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClientCache: SupabaseClient | undefined;

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  if (typeof window === 'undefined') return null;

  if (!supabaseClientCache) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;

    supabaseClientCache = createBrowserClient(url, anonKey);
  }

  return supabaseClientCache;
};
