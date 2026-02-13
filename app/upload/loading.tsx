import { Skeleton } from '../components/ui/Skeleton';

export default function UploadLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white py-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header skeleton */}
                <div className="mb-8 text-center">
                    <Skeleton className="h-10 w-64 mx-auto mb-4" />
                    <Skeleton className="h-6 w-96 mx-auto" />
                </div>

                {/* Upload area skeleton */}
                <div className="bg-zinc-900/80 rounded-2xl shadow-2xl p-8 border border-zinc-800 backdrop-blur-md">
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-12">
                        <div className="text-center">
                            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                            <Skeleton className="h-6 w-48 mx-auto mb-2" />
                            <Skeleton className="h-4 w-64 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
