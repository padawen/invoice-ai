import { Skeleton } from '../components/ui/Skeleton';

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-64 mb-4" />
                    <Skeleton className="h-6 w-96" />
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </div>

                {/* Projects grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
