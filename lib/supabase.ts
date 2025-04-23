// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

// Ügyelünk arra, hogy a változók elérhetők legyenek SSR és Client oldalon is
export const createSupabaseClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase URL or ANON KEY is missing in environment variables.');
  }

  return createBrowserClient(url, anonKey);
};
