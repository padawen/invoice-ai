'use client';

import { useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';

export default function LoginPage() {
  const supabase = createSupabaseClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = '/upload';
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // cleanup
    };
  }, [supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight text-green-400">
        Invoice AI
      </h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-500 transition px-6 py-3 rounded-xl shadow text-white font-medium"
      >
        Sign in with Google
      </button>
    </main>
  );
}
