export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white">
            <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-zinc-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-400 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-green-400 mb-2">Loading</h2>
                <p className="text-zinc-400 text-sm">Please wait...</p>
            </div>
        </div>
    );
}
