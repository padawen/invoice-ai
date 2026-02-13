'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Application error', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white px-4">
            <div className="max-w-md w-full bg-zinc-900/80 rounded-2xl shadow-2xl p-8 border border-zinc-800 backdrop-blur-md text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="text-red-400" size={32} />
                </div>

                <h2 className="text-2xl font-bold text-red-400 mb-3">
                    Something went wrong!
                </h2>

                <p className="text-zinc-400 mb-6">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>

                {process.env.NODE_ENV === 'development' && error.digest && (
                    <p className="text-xs text-zinc-500 mb-6 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 transition-colors rounded-lg font-semibold"
                    >
                        <RefreshCw size={18} />
                        Try again
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 transition-colors rounded-lg font-semibold"
                    >
                        <Home size={18} />
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
