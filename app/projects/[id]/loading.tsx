import { Skeleton } from '../../components/ui/Skeleton';

export default function ProjectLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Financial summary skeleton */}
                <div className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60 mb-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters skeleton */}
                <div className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60 mb-6">
                    <Skeleton className="h-10 w-full" />
                </div>

                {/* Invoice cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                            <Skeleton className="h-6 w-32 mb-3" />
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-4 w-40 mb-2" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
