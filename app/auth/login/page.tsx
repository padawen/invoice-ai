'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';



export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(() => createSupabaseBrowserClient());

  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session) router.push('/upload');
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, router]);

  const handleGoogleLogin = async () => {
    if (!supabase) return;

    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/upload`
      : `${window.location.origin}/upload`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };


  return (
    <main className="select-none flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {/* Green orbs - entire left side */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-[5%] left-[8%] w-[300px] h-[300px] bg-green-400/12 rounded-full blur-3xl animate-bounce [animation-delay:0.5s]" />
        <div className="absolute top-[15%] left-[15%] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-3xl animate-bounce [animation-delay:1s]" />
        <div className="absolute top-[40%] left-[5%] w-[250px] h-[250px] bg-green-500/12 rounded-full blur-3xl animate-bounce [animation-delay:1.8s]" />
        <div className="absolute top-[60%] left-[10%] w-[280px] h-[280px] bg-emerald-400/10 rounded-full blur-3xl animate-bounce [animation-delay:0.3s]" />
        <div className="absolute bottom-[10%] left-[8%] w-[220px] h-[220px] bg-green-400/11 rounded-full blur-3xl animate-bounce [animation-delay:2.2s]" />

        {/* Blue orbs - entire right side */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-2xl animate-bounce [animation-delay:1.5s]" />
        <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] bg-blue-400/12 rounded-full blur-3xl animate-bounce [animation-delay:2s]" />
        <div className="absolute bottom-[20%] right-[15%] w-[180px] h-[180px] bg-cyan-500/10 rounded-full blur-3xl animate-bounce [animation-delay:0.8s]" />
        <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-blue-500/11 rounded-full blur-3xl animate-bounce [animation-delay:1.2s]" />
        <div className="absolute top-[35%] right-[8%] w-[240px] h-[240px] bg-cyan-400/10 rounded-full blur-3xl animate-bounce [animation-delay:0.6s]" />
        <div className="absolute top-[55%] right-[12%] w-[200px] h-[200px] bg-blue-400/11 rounded-full blur-3xl animate-bounce [animation-delay:2.5s]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8 border border-zinc-800 backdrop-blur-md">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center">
          Invoice AI
        </h1>
        <p className="text-zinc-400 text-center text-lg">Sign in to access your smart invoice workspace</p>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 transition-colors px-8 py-4 rounded-xl shadow-lg text-white font-semibold text-lg border border-blue-700 hover:border-blue-600 w-full justify-center cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0)">
              <path d="M47.532 24.552c0-1.636-.146-3.272-.438-4.908H24.48v9.292h13.01c-.563 2.98-2.25 5.48-4.771 7.188v5.98h7.7c4.52-4.167 7.113-10.292 7.113-17.552z" fill="#4285F4" />
              <path d="M24.48 48c6.48 0 11.93-2.146 15.907-5.833l-7.7-5.98c-2.146 1.438-4.917 2.292-8.207 2.292-6.313 0-11.667-4.271-13.583-10.021H2.58v6.25C6.646 43.938 14.646 48 24.48 48z" fill="#34A853" />
              <path d="M10.897 28.458A13.98 13.98 0 0 1 9.48 24c0-1.542.271-3.021.688-4.458v-6.25H2.58A23.98 23.98 0 0 0 .48 24c0 3.938.938 7.708 2.604 11.021l7.813-6.563z" fill="#FBBC05" />
              <path d="M24.48 9.5c3.521 0 6.646 1.208 9.104 3.563l6.813-6.813C36.406 2.938 30.959 0 24.48 0 14.646 0 6.646 4.063 2.58 10.25l7.813 6.25c1.916-5.75 7.27-10.021 13.583-10.021z" fill="#EA4335" />
            </g>
            <defs>
              <clipPath id="clip0"><path fill="#fff" d="M0 0h48v48H0z" /></clipPath>
            </defs>
          </svg>
          Sign in with Google
        </button>

      </div>
    </main>
  );
}
