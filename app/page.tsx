'use client';

import { ArrowRight, Upload, Github, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from './providers';
import Footer from './components/Footer';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const user = useUser();
  const [visibleBlocks, setVisibleBlocks] = useState<Set<number>>(new Set());
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = blockRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleBlocks((prev) => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Zero Manual Entry',
      description: 'Upload invoices and let AI do the work. No more typos, copy-paste or wasted hours.',
      color: 'green',
      gradient: 'from-green-500/20 via-transparent to-transparent',
    },
    {
      icon: Clock,
      title: 'Lightning-Fast Workflow',
      description: 'Go from PDF to structured data instantly. Seamlessly preview, edit, and export.',
      color: 'emerald',
      gradient: 'from-emerald-500/20 via-transparent to-transparent',
    },
    {
      icon: CheckCircle,
      title: 'Export-Ready Output',
      description: 'Clean, structured data ready for accounting, databases, or your next automation.',
      color: 'green',
      gradient: 'from-green-400/20 via-transparent to-transparent',
    },
    {
      icon: Shield,
      title: 'Privacy Mode',
      description: 'On-premise processing keeps your data secure. Slower than OpenAI but fully private.',
      color: 'blue',
      gradient: 'from-blue-500/20 via-transparent to-transparent',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white relative overflow-x-hidden select-none">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent opacity-40 pointer-events-none animate-pulse" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-40 pointer-events-none animate-pulse [animation-delay:1s]" />

      {/* Floating orbs */}
      <div className="fixed top-[5%] left-[10%] w-64 h-64 bg-green-500/25 rounded-full blur-3xl animate-pulse" />
      <div className="fixed top-[15%] right-[8%] w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]" />
      <div className="fixed bottom-[10%] left-[70%] w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse [animation-delay:1.5s]" />

      {/* Hero Section */}
      <section className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="text-center space-y-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <header className="space-y-6">
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


        </div>
      </section>

      {/* Features Section - Scrollable with animations */}
      <section className="min-h-[50vh] flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-7xl w-full space-y-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              Why Choose Invoice AI?
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Four powerful features that transform your invoice processing workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isVisible = visibleBlocks.has(index);
              const colorClasses = {
                green: 'text-green-400 border-green-500/50 shadow-green-500/10',
                emerald: 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/10',
                blue: 'text-blue-400 border-blue-500/50 shadow-blue-500/10',
              }[feature.color];

              return (
                <div
                  key={index}
                  ref={(el) => { blockRefs.current[index] = el; }}
                  className={`
                    group relative p-8 lg:p-10 
                    bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 
                    backdrop-blur-sm rounded-2xl 
                    border border-zinc-700/50 
                    transition-all duration-700 
                    hover:scale-105 hover:shadow-2xl
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}
                    ${isVisible ? `hover:${colorClasses}` : ''}
                  `}
                  style={{
                    transitionDelay: `${index * 150}ms`,
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none`} />

                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-${feature.color}-500/20 transition-colors duration-300`}>
                      <Icon className={`text-${feature.color}-400`} size={32} />
                    </div>
                    <h3 className={`text-2xl font-bold text-${feature.color}-400 mb-4`}>
                      {feature.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-[50vh] flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Join thousands of businesses automating their invoice processing with AI
          </p>
          <Link
            href={user ? '/upload' : '/auth/login'}
            className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 rounded-2xl text-white font-bold text-xl shadow-2xl shadow-green-500/30 hover:scale-105 hover:shadow-green-500/50"
          >
            <Upload size={28} />
            <span>Get Started Now</span>
            <ArrowRight size={28} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
