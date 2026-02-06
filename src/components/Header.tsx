'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

interface HeaderProps {
  showAuth?: boolean;
}

export default function Header({ showAuth = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  let authenticated = false;
  let user: { email?: { address?: string }; wallet?: { address?: string } } | null = null;
  let login: (() => void) | undefined;
  let logout: (() => void) | undefined;

  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    user = privy.user;
    login = privy.login;
    logout = privy.logout;
  } catch {
    // Privy not available
  }

  return (
    <header className="border-b border-stone-800">
      <div className="flex justify-between items-center p-4">
        <Link href="/" className="text-xl sm:text-2xl western-font text-amber-500 hover:text-amber-400">
          🤠 MEATBOARD
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
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
                  <span className="text-sm text-stone-500 font-mono max-w-[120px] truncate">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-stone-400 hover:text-amber-500 p-2"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-stone-800 p-4 space-y-4">
          <Link
            href="/human"
            className="block text-stone-300 hover:text-amber-500 font-mono py-2"
            onClick={() => setMenuOpen(false)}
          >
            🤠 Bounties
          </Link>
          <Link
            href="/agent"
            className="block text-stone-300 hover:text-amber-500 font-mono py-2"
            onClick={() => setMenuOpen(false)}
          >
            🤖 API Docs
          </Link>
          
          {showAuth && (
            <>
              {authenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-stone-300 hover:text-amber-500 font-mono py-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                  <div className="pt-2 border-t border-stone-800">
                    <span className="block text-sm text-stone-500 font-mono mb-2 truncate">
                      {user?.email?.address || user?.wallet?.address?.slice(0, 12) + '...'}
                    </span>
                    <button
                      onClick={() => { logout?.(); setMenuOpen(false); }}
                      className="text-sm text-stone-400 hover:text-amber-500 font-mono"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { login?.(); setMenuOpen(false); }}
                  className="btn-western w-full px-4 py-3 text-sm rounded"
                >
                  Sign In
                </button>
              )}
            </>
          )}
        </nav>
      )}
    </header>
  );
}
