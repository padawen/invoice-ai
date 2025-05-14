'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Geist } from 'next/font/google';

const geistSans = Geist({ subsets: ['latin'], weight: ['400', '700'] });

const Navbar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useUser();
  const supabase = useSupabaseClient();

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = user
    ? [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/upload', label: 'Upload' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
      ];

  return (
    <nav className="w-full bg-zinc-900/95 backdrop-blur-sm text-white shadow-lg sticky top-0 z-50 border-b border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent hover:from-green-300 hover:to-emerald-400 transition ${geistSans.className}`}
            style={{ letterSpacing: '-0.04em' }}
          >
            Invoice AI
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-base font-semibold hover:text-green-400 transition-colors ${
                  pathname === href ? 'text-green-400' : 'text-zinc-200'
                }`}
                style={{ letterSpacing: '-0.01em' }}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-base text-zinc-300">
                  <User size={18} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all border border-zinc-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ fontSize: '1rem' }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all border border-green-600 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '1rem' }}
              >
                Login with Google
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button 
            className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors" 
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu content */}
        {open && (
          <div className="md:hidden flex flex-col gap-3 pb-4 pt-2 border-t border-zinc-800">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-base font-semibold hover:text-green-400 transition-colors ${
                  pathname === href ? 'text-green-400' : 'text-zinc-200'
                }`}
                style={{ letterSpacing: '-0.01em' }}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-base text-zinc-300">
                  <User size={18} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all border border-zinc-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ fontSize: '1rem' }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleLogin();
                  setOpen(false);
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all border border-green-600 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '1rem' }}
              >
                Login with Google
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
