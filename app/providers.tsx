'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, User } from '@supabase/supabase-js';
import type { PropsWithChildren } from 'react';

const UserContext = createContext<User | null>(null);
const SessionContext = createContext<Session | null>(null);

export const useUser = () => useContext(UserContext);
export const useSession = () => useContext(SessionContext);

export default function Providers({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [supabaseClient] = useState(() => {
    if (
      typeof window === 'undefined' ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });

  useEffect(() => {
    if (!supabaseClient) return;

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseClient]);

  return (
    <UserContext.Provider value={user}>
      <SessionContext.Provider value={session}>
        {children}
      </SessionContext.Provider>
    </UserContext.Provider>
  );
}
