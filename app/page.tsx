'use client';

import { ArrowRight, Upload, Github, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from './providers';
import Footer from './components/Footer';

export default function Home() {
  const user = useUser();

  return (
    <main className="flex-grow flex flex-col bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-hidden select-none pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent opacity-40 pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-40 pointer-events-none animate-pulse [animation-delay:1s]" />
      <div className="absolute top-[5%] left-[10%] w-64 h-64 bg-green-500/25 rounded-full blur-3xl animate-bounce" />
      <div className="absolute top-[15%] right-[8%] w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-bounce [animation-delay:1s]" />
      <div className="absolute bottom-[10%] left-[70%] w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-bounce [animation-delay:3s]" />
      <div className="absolute bottom-[8%] right-[65%] w-56 h-56 bg-green-300/20 rounded-full blur-3xl animate-bounce [animation-delay:0.5s]" />
      <div className="absolute top-[50%] left-[45%] w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl animate-bounce [animation-delay:2s]" />
      <div className="absolute top-[25%] left-[35%] w-48 h-48 bg-green-400/15 rounded-full blur-3xl animate-bounce [animation-delay:1.5s]" />
      <div className="absolute top-[30%] right-[30%] w-52 h-52 bg-emerald-300/15 rounded-full blur-3xl animate-bounce [animation-delay:2.5s]" />
      <div className="absolute top-[40%] left-[20%] w-60 h-60 bg-green-500/15 rounded-full blur-3xl animate-bounce [animation-delay:0.8s]" />
      <div className="absolute top-[35%] right-[18%] w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl animate-bounce [animation-delay:1.8s]" />
      <div className="absolute top-[12%] left-[50%] w-44 h-44 bg-green-300/18 rounded-full blur-3xl animate-bounce [animation-delay:0.3s]" />
      <div className="absolute top-[60%] right-[15%] w-50 h-50 bg-emerald-500/18 rounded-full blur-3xl animate-bounce [animation-delay:2.2s]" />
      <div className="absolute bottom-[25%] left-[15%] w-48 h-48 bg-green-400/16 rounded-full blur-3xl animate-bounce [animation-delay:1.2s]" />
      <div className="absolute top-[70%] left-[55%] w-52 h-52 bg-emerald-300/16 rounded-full blur-3xl animate-bounce [animation-delay:2.8s]" />
      <div className="absolute top-[20%] left-[75%] w-46 h-46 bg-green-500/17 rounded-full blur-3xl animate-bounce [animation-delay:0.6s]" />
      <div className="absolute bottom-[30%] right-[40%] w-54 h-54 bg-emerald-400/17 rounded-full blur-3xl animate-bounce [animation-delay:1.4s]" />
      <div className="absolute top-[55%] left-[8%] w-58 h-58 bg-green-300/16 rounded-full blur-3xl animate-bounce [animation-delay:2.6s]" />
      <div className="absolute bottom-[45%] right-[50%] w-50 h-50 bg-emerald-500/18 rounded-full blur-3xl animate-bounce [animation-delay:0.9s]" />
      <div className="absolute top-[45%] right-[5%] w-48 h-48 bg-green-400/15 rounded-full blur-3xl animate-bounce [animation-delay:1.7s]" />
      <div className="absolute bottom-[20%] left-[40%] w-52 h-52 bg-emerald-300/17 rounded-full blur-3xl animate-bounce [animation-delay:2.3s]" />
      <div className="absolute top-[8%] left-[25%] w-42 h-42 bg-green-500/16 rounded-full blur-3xl animate-bounce [animation-delay:0.4s]" />
      <div className="absolute top-[65%] right-[25%] w-46 h-46 bg-emerald-400/16 rounded-full blur-3xl animate-bounce [animation-delay:2.4s]" />
      <div className="absolute bottom-[35%] left-[60%] w-48 h-48 bg-green-300/17 rounded-full blur-3xl animate-bounce [animation-delay:1.1s]" />
      <div className="absolute top-[75%] right-[35%] w-50 h-50 bg-emerald-500/16 rounded-full blur-3xl animate-bounce [animation-delay:2.7s]" />
      <div className="absolute top-[18%] left-[5%] w-44 h-44 bg-green-400/18 rounded-full blur-3xl animate-bounce [animation-delay:0.7s]" />
      <div className="absolute bottom-[15%] right-[20%] w-52 h-52 bg-emerald-300/18 rounded-full blur-3xl animate-bounce [animation-delay:1.9s]" />
      <div className="absolute top-[52%] left-[72%] w-46 h-46 bg-green-500/15 rounded-full blur-3xl animate-bounce [animation-delay:2.1s]" />
      <div className="absolute bottom-[40%] left-[28%] w-48 h-48 bg-emerald-400/16 rounded-full blur-3xl animate-bounce [animation-delay:1.3s]" />
      <div className="absolute top-[28%] right-[45%] w-50 h-50 bg-green-300/17 rounded-full blur-3xl animate-bounce [animation-delay:0.2s]" />
      <div className="absolute bottom-[50%] right-[8%] w-54 h-54 bg-emerald-500/17 rounded-full blur-3xl animate-bounce [animation-delay:2.9s]" />

      <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center space-y-12 max-w-6xl relative z-10">
          <header className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                Automate Invoicing.
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Free Your Time.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              AI-driven invoice processing that feels like magic - from PDF to structured data in <span className="text-green-400 font-semibold">seconds</span>.
            </p>
          </header>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms]">
            <Link
              href={user ? '/upload' : '/auth/login'}
              className="group px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 rounded-2xl text-white font-bold text-lg shadow-2xl shadow-green-500/30 flex items-center gap-3 hover:scale-105 hover:shadow-green-500/50"
            >
              <Upload size={24} />
              <span>{user ? 'Start Processing' : 'Login to Begin'}</span>
              <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
            </Link>

            <a
              href="https://github.com/padawen/"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-10 py-5 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm transition-all duration-300 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-3 hover:scale-105 border border-zinc-700/50 hover:border-zinc-600"
            >
              <Github size={24} />
              <span>View on GitHub</span>
            </a>
          </div>

          <div className="pt-16 pb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group p-8 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm rounded-2xl border border-zinc-700/50 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <Zap className="text-green-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-3">Zero Manual Entry</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Upload invoices and let AI do the work. No more typos, copy-paste or wasted hours.
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm rounded-2xl border border-zinc-700/50 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Clock className="text-emerald-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-emerald-400 mb-3">Lightning-Fast Workflow</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Go from PDF to structured data instantly. Seamlessly preview, edit, and export.
                </p>
              </div>

              <div className="group p-8 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm rounded-2xl border border-zinc-700/50 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-3">Export-Ready Output</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Clean, structured data ready for accounting, databases, or your next automation.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full md:w-1/3">
                <div className="group p-8 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm rounded-2xl border border-zinc-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
                  <div className="w-12 h-12 md:mx-auto bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Shield className="text-blue-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-blue-400 mb-3 md:text-center">Privacy Mode</h3>
                  <p className="text-zinc-400 leading-relaxed md:text-center">
                    On-premise processing keeps your data secure. Slower than OpenAI but fully private.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
