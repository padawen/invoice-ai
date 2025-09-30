export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full py-2 px-6 flex justify-center text-center z-10 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800">
      <div className="text-zinc-400 text-base">
        © {new Date().getFullYear()} Invoice AI · Built with <span className="text-yellow-200">🥂</span>, <span className="text-blue-300">💧</span>, <span className="text-green-400">🌿</span> & <span className="text-zinc-400">Next.js</span>
      </div>
    </footer>
  );
}