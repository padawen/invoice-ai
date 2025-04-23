export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow">
          Invoice AI
        </h1>
        <p className="text-lg md:text-xl text-zinc-300">
          Upload your invoices. Let AI do the rest.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/upload"
            className="px-6 py-3 bg-green-500 hover:bg-green-600 transition rounded-xl text-white font-semibold shadow-lg"
          >
            Start Processing
          </a>
          <a
            href="https://github.com/your-repo"
            target="_blank"
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 transition rounded-xl text-white font-semibold shadow-lg"
          >
            GitHub
          </a>
        </div>
      </div>

      <footer className="absolute bottom-4 text-xs text-zinc-500">
        © {new Date().getFullYear()} Invoice AI – Built with ❤️ and Tailwind
      </footer>
    </main>
  );
}
