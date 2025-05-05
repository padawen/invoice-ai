import { ArrowRight, Upload, Github } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-50" />
      
      <div className="text-center space-y-8 max-w-3xl relative z-10">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent animate-gradient">
            Invoice AI
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto">
            Transform your invoice processing with AI-powered automation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link
            href="/upload"
            className="group px-8 py-4 bg-green-600 hover:bg-green-500 transition-all rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 hover:scale-105"
          >
            <Upload size={20} />
            <span>Start Processing</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/your-repo"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 bg-zinc-800 hover:bg-zinc-700 transition-all rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 hover:scale-105"
          >
            <Github size={20} />
            <span>View on GitHub</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition-colors">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Smart Processing</h3>
            <p className="text-zinc-400">AI-powered extraction of invoice data with high accuracy</p>
          </div>
          <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition-colors">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Easy Integration</h3>
            <p className="text-zinc-400">Seamlessly integrate with your existing workflow</p>
          </div>
          <div className="p-6 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 hover:border-green-500/50 transition-colors">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Real-time Preview</h3>
            <p className="text-zinc-400">Preview and edit extracted data before finalizing</p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-sm text-zinc-500">
        © {new Date().getFullYear()} Invoice AI – Built with ❤️ and Next.js
      </footer>
    </main>
  );
}
