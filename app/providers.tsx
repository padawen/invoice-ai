'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { PropsWithChildren } from 'react';

export default function Providers({ children }: PropsWithChildren) {
  const [supabaseClient] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}
