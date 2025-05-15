import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// We'll keep this reference at the module level for client-side caching
let supabaseClientCache: SupabaseClient | undefined;

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    console.warn('Attempted to create Supabase client on the server');
    return null;
  }
  
  // Reuse the client if we've already created it
  if (!supabaseClientCache) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !anonKey) {
        console.error('Missing Supabase credentials');
        return null;
      }
      
      supabaseClientCache = createBrowserClient(url, anonKey);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }
  
  return supabaseClientCache;
}; 