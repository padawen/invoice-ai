'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/upload', label: 'Upload' },
  { href: '/dashboard', label: 'Dashboard' },
];

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

  return (
    <nav className="w-full bg-zinc-900/95 backdrop-blur-sm text-white shadow-lg sticky top-0 z-50 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent hover:from-green-300 hover:to-emerald-400 transition"
          >
            Invoice AI
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-6 items-center">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium hover:text-green-400 transition-colors ${
                  pathname === href ? 'text-green-400' : 'text-zinc-300'
                }`}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <User size={16} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
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
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium hover:text-green-400 transition-colors ${
                  pathname === href ? 'text-green-400' : 'text-zinc-300'
                }`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <User size={16} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleLogin();
                  setOpen(false);
                }}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
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
