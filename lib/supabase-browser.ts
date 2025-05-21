'use client';

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClientCache: SupabaseClient | null = null;

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  if (typeof window === 'undefined') return null;

  if (!supabaseClientCache) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error('Missing required environment variables for authentication');
      return null;
    }

    supabaseClientCache = createClient(url, anonKey);
  }

  return supabaseClientCache;
};
