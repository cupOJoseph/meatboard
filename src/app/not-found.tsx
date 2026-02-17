import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🥩</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          This page has gone missing from the market.
        </p>
        <Link 
          href="/"
          className="btn-western px-6 py-3 rounded-lg inline-block"
        >
          🥩 Head Back Home
        </Link>
      </div>
    </main>
  );
}
