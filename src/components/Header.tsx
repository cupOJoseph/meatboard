'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

interface HeaderProps {
  showAuth?: boolean;
}

export default function Header({ showAuth = true }: HeaderProps) {
  let authenticated = false;
  let user: { email?: { address?: string }; wallet?: { address?: string } } | null = null;
  let login: (() => void) | undefined;
  let logout: (() => void) | undefined;

  // Try to use Privy, but handle case where it's not available
  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    user = privy.user;
    login = privy.login;
    logout = privy.logout;
  } catch {
    // Privy not available (no app ID configured)
  }

  return (
    <header className="flex justify-between items-center p-4 border-b border-stone-800">
      <Link href="/" className="text-2xl western-font text-amber-500 hover:text-amber-400">
        🤠 MEATBOARD
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/human" className="text-stone-400 hover:text-amber-500 text-sm font-mono">
          Bounties
        </Link>
        <Link href="/agent" className="text-stone-400 hover:text-amber-500 text-sm font-mono">
          API Docs
        </Link>

        {showAuth && (
          <>
            {authenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-stone-400 hover:text-amber-500 text-sm font-mono"
                >
                  Dashboard
                </Link>
                <span className="text-sm text-stone-500 font-mono">
                  {user?.email?.address || user?.wallet?.address?.slice(0, 8) + '...'}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-stone-500 hover:text-amber-500 font-mono"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn-western px-4 py-2 text-sm rounded"
              >
                Sign In
              </button>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
