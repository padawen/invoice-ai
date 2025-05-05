'use client';

import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Session } from '@supabase/supabase-js';

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (session) {
        window.location.href = '/upload';
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-2xl" />
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8 border border-zinc-800 backdrop-blur-md">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2 text-center">
          Invoice AI
        </h1>
        <p className="text-zinc-400 text-center mb-4 text-lg">Sign in to access your smart invoice workspace</p>
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 transition px-8 py-4 rounded-xl shadow-lg text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.272-.438-4.908H24.48v9.292h13.01c-.563 2.98-2.25 5.48-4.771 7.188v5.98h7.7c4.52-4.167 7.113-10.292 7.113-17.552z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.93-2.146 15.907-5.833l-7.7-5.98c-2.146 1.438-4.917 2.292-8.207 2.292-6.313 0-11.667-4.271-13.583-10.021H2.58v6.25C6.646 43.938 14.646 48 24.48 48z" fill="#34A853"/><path d="M10.897 28.458A13.98 13.98 0 0 1 9.48 24c0-1.542.271-3.021.688-4.458v-6.25H2.58A23.98 23.98 0 0 0 .48 24c0 3.938.938 7.708 2.604 11.021l7.813-6.563z" fill="#FBBC05"/><path d="M24.48 9.5c3.521 0 6.646 1.208 9.104 3.563l6.813-6.813C36.406 2.938 30.959 0 24.48 0 14.646 0 6.646 4.063 2.58 10.25l7.813 6.25c1.916-5.75 7.27-10.021 13.583-10.021z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><path fill="#fff" d="M0 0h48v48H0z"/></clipPath></defs></svg>
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
