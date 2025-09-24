import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config';

export const createSupabaseClient = (accessToken?: string): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
