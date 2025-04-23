'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useUser } from '@supabase/auth-helpers-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/upload', label: 'Upload' },
  { href: '/dashboard', label: 'Dashboard' },
];

const Navbar = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useUser();

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  return (
    <nav className="w-full bg-zinc-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-green-400 hover:text-green-300 transition"
          >
            Invoice AI
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-6 items-center">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium hover:text-green-400 transition ${
                  pathname === href ? 'text-green-400' : 'text-white'
                }`}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <button
                onClick={handleLogin}
                className="ml-4 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition"
              >
                Login with Google
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu content */}
        {open && (
          <div className="md:hidden flex flex-col gap-3 pb-4 pt-2 border-t border-zinc-700">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium hover:text-green-400 transition ${
                  pathname === href ? 'text-green-400' : 'text-white'
                }`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <button
                onClick={() => {
                  handleLogin();
                  setOpen(false);
                }}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition mt-2"
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
