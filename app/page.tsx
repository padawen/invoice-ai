'use client';

import { ArrowRight, Upload, Github } from 'lucide-react';
import Link from 'next/link';
import { useUser } from './providers';
import Footer from './components/Footer';

export default function Home() {
  const user = useUser();

  return (
    <main className="flex-grow flex flex-col bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden select-none pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-10 max-w-3xl relative z-10">
          <header className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent animate-gradient">
              Automate Invoicing.<br />Free Your Time.
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-xl mx-auto">
              AI-driven invoice processing that feels like magic - from PDF to structured data in seconds.
            </p>
          </header>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link
              href={user ? '/upload' : '/auth/login'}
              className="group px-8 py-4 bg-green-600 hover:bg-green-500 transition-all rounded-xl text-white font-semibold shadow-lg flex items-center gap-2 hover:scale-105"
            >
              <Upload size={20} />
              <span>{user ? 'Start Processing' : 'Login to Begin'}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="https://github.com/padawen/"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-zinc-800 hover:bg-zinc-700 transition-all rounded-xl text-white font-semibold shadow-lg flex items-center gap-2 hover:scale-105"
            >
              <Github size={20} />
              <span>View on GitHub</span>
            </a>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 pb-20 text-left">
            <div className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Zero Manual Entry</h3>
              <p className="text-zinc-400">
                Upload invoices and let AI do the work. No more typos, copy-paste or wasted hours.
              </p>
            </div>
            <div className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Lightning-Fast Workflow</h3>
              <p className="text-zinc-400">
                Go from PDF to structured data instantly. Seamlessly preview, edit, and export.
              </p>
            </div>
            <div className="p-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition">
              <h3 className="text-lg font-semibold text-green-400 mb-2">Export-Ready Output</h3>
              <p className="text-zinc-400">
                Clean, structured data ready for accounting, databases, or your next automation.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
