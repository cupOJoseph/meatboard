import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="wanted-poster relative p-8 sm:p-12 max-w-sm sm:max-w-md w-full text-center">
        <h1 className="text-5xl sm:text-6xl mb-4">🌵</h1>
        <h2 className="text-2xl sm:text-3xl mb-4">WANTED</h2>
        <p className="text-stone-600 font-mono text-sm sm:text-base mb-6">
          This page has gone missing, partner.
        </p>
        <div className="w-12 sm:w-16 h-1 bg-amber-700 mx-auto mb-6"></div>
        <p className="text-xs sm:text-sm text-stone-500 font-mono">ERROR 404</p>
      </div>
      
      <Link 
        href="/"
        className="btn-western mt-8 px-6 py-3 text-base sm:text-lg rounded w-full sm:w-auto text-center max-w-xs"
      >
        🤠 Head Back Home
      </Link>
    </main>
  );
}
