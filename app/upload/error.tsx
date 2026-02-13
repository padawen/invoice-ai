'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UploadError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error('Upload page error', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-zinc-900/80 rounded-2xl shadow-2xl p-8 border border-zinc-800 backdrop-blur-md text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="text-red-400" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-red-400 mb-3">
                        Upload page error
                    </h2>

                    <p className="text-zinc-400 mb-6">
                        We couldn't load the upload page. Please try again or go back to the dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 transition-colors rounded-lg font-semibold"
                        >
                            <RefreshCw size={18} />
                            Try again
                        </button>

                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 transition-colors rounded-lg font-semibold"
                        >
                            <ArrowLeft size={18} />
                            Back to dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
