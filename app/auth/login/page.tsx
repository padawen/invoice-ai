'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

let clientSideSupabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export default function LoginPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [showDonatLogin, setShowDonatLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!clientSideSupabase) {
      const client = createSupabaseBrowserClient();
      if (client) {
        clientSideSupabase = client;
        setSupabase(client);
      }
    }
  }, []);
  
  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session) window.location.href = '/upload';
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoginLoading(true);
    setLoginError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-8 border border-zinc-800 backdrop-blur-md">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center">
          Invoice AI
        </h1>
        <p className="text-zinc-400 text-center text-lg">Sign in to access your smart invoice workspace</p>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 transition-colors px-8 py-4 rounded-xl shadow-lg text-white font-semibold text-lg border border-blue-700 hover:border-blue-600 w-full justify-center"
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

        {/* Divider */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-700"></div>
          <span className="text-zinc-500 text-sm">or</span>
          <div className="flex-1 h-px bg-zinc-700"></div>
        </div>

        {/* Donát Login Collapsible Section */}
        <div className="w-full">
          <button
            onClick={() => setShowDonatLogin(!showDonatLogin)}
            className="w-full flex items-center justify-center gap-3 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors px-6 py-3 rounded-lg border border-zinc-700/50 text-zinc-300 hover:text-white"
          >
            <span className="font-medium">Donát Login</span>
            {showDonatLogin ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {/* Collapsible Email/Password Form */}
          {showDonatLogin && (
            <form onSubmit={handleEmailLogin} className="mt-4 space-y-4 border-t border-zinc-700/50 pt-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                  {loginError}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 transition-colors px-6 py-3 rounded-lg text-white font-semibold shadow-lg disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
