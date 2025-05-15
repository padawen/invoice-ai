'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { PropsWithChildren } from 'react';

export default function Providers({ children }: PropsWithChildren) {
  // Using useState to create the client ensures it only happens during component rendering
  // which is at runtime, not during static build
  const [supabaseClient] = useState(() => {
    // This code only runs in the browser at runtime
    if (typeof window !== 'undefined') {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    // Return null during server-side rendering
    return null;
  });

  // Only render the provider when we have a client
  // This ensures we don't try to use an uninitialized client during SSR
  if (!supabaseClient) {
    return <>{children}</>;
  }

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}
