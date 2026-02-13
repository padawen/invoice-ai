import { Skeleton } from '../../../../../components/ui/Skeleton';

export default function EditInvoiceLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
            <div className="w-full max-w-7xl mx-auto bg-zinc-900/80 rounded-2xl shadow-2xl p-8 border border-zinc-800 backdrop-blur-md">
                {/* Header skeleton */}
                <div className="mb-8 flex items-center">
                    <Skeleton className="h-10 w-32 mr-4" />
                    <Skeleton className="h-10 flex-1" />
                </div>

                {/* Form sections skeleton */}
                <div className="space-y-6">
                    {/* Seller section */}
                    <div className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i}>
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buyer section */}
                    <div className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i}>
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Invoice details */}
                    <div className="bg-zinc-800/60 rounded-xl p-6 border border-zinc-700/60">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i}>
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save button skeleton */}
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}
