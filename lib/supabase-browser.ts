'use client';

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from '@/lib/public-env';

let supabaseClientCache: SupabaseClient | null = null;

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  if (typeof window === 'undefined') return null;

  if (!supabaseClientCache) {
    if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables for authentication');
      return null;
    }

    supabaseClientCache = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return supabaseClientCache;
};
