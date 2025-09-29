'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, User, Loader2 } from 'lucide-react';
import { Geist } from 'next/font/google';
import { useUser } from '../providers';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const geistSans = Geist({ subsets: ['latin'], weight: ['400', '700'] });

interface NavbarProps {
  isProcessing?: boolean;
}

const Navbar = ({ isProcessing = false }: NavbarProps) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useUser();
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const client = createSupabaseBrowserClient();
      if (client) setSupabase(client);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
  ];

  const LinkItem = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`text-lg font-semibold transition-colors ${
        pathname === href ? 'text-green-400' : 'text-zinc-200 hover:text-green-400'
      } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      onClick={() => setOpen(false)}
      aria-disabled={isProcessing}
      tabIndex={isProcessing ? -1 : 0}
    >
      {label}
    </Link>
  );

  return (
    <nav className={`w-full backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b transition-colors duration-300
      ${isProcessing ? 'border-green-800/30' : 'border-zinc-800'}
      bg-zinc-900/95 text-white font-sans select-none`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent hover:from-green-300 hover:to-emerald-400 transition ${geistSans.className} ${
                isProcessing ? 'pointer-events-none' : ''
              }`}
              style={{ letterSpacing: '-0.04em' }}
              aria-disabled={isProcessing}
              tabIndex={isProcessing ? -1 : 0}
            >
              Invoice AI
            </Link>
            {isProcessing && (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium ml-4">
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <LinkItem key={link.href} {...link} />
            ))}

            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-300">
                  <User size={18} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2 rounded-lg text-base font-medium shadow-lg transition cursor-pointer ${
                    isProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isProcessing}
                className={`bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-2 rounded-lg text-base font-medium shadow-lg transition cursor-pointer ${
                  isProcessing ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Login with Google
              </button>
            )}
          </div>

          <button
            className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            onClick={() => setOpen(!open)}
            disabled={isProcessing}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden flex flex-col gap-4 pb-4 pt-2 border-t border-zinc-800">
            {navLinks.map((link) => (
              <LinkItem key={link.href} {...link} />
            ))}

            {user ? (
              <div className="flex flex-col gap-4 pt-4 mt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-300">
                  <User size={18} />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  disabled={isProcessing}
                  className={`flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-2 rounded-lg text-base font-medium shadow-lg transition cursor-pointer ${
                    isProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}
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
                disabled={isProcessing}
                className={`bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-2 rounded-lg text-base font-medium shadow-lg transition cursor-pointer ${
                  isProcessing ? 'opacity-50 pointer-events-none' : ''
                }`}
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
