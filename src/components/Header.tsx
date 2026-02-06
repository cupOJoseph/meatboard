'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';

export default function Header() {
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
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤠</span>
          <span className="text-xl font-bold text-gray-900">meatboard</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/human" className="text-gray-600 hover:text-amber-600 text-sm font-medium">
            Bounties
          </Link>
          <Link href="/agent" className="text-gray-600 hover:text-amber-600 text-sm font-medium">
            API Docs
          </Link>
          <a 
            href="https://github.com/cupOJoseph/meatboard" 
            target="_blank"
            className="text-gray-600 hover:text-amber-600 text-sm font-medium"
          >
            GitHub
          </a>

          {authenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-amber-600 text-sm font-medium"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-mono max-w-[100px] truncate">
                  {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="btn-western px-4 py-2 text-sm rounded-lg"
            >
              Connect Wallet
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 hover:text-amber-600 p-2"
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
        <nav className="md:hidden border-t border-gray-200 bg-white p-4 space-y-3">
          <Link
            href="/human"
            className="block text-gray-700 hover:text-amber-600 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            🤠 Bounties
          </Link>
          <Link
            href="/agent"
            className="block text-gray-700 hover:text-amber-600 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            🤖 API Docs
          </Link>
          <a 
            href="https://github.com/cupOJoseph/meatboard" 
            target="_blank"
            className="block text-gray-700 hover:text-amber-600 font-medium py-2"
          >
            GitHub
          </a>
          
          {authenticated ? (
            <>
              <Link
                href="/dashboard"
                className="block text-gray-700 hover:text-amber-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                📊 Dashboard
              </Link>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-mono truncate">
                    {user?.wallet?.address?.slice(0, 8)}...{user?.wallet?.address?.slice(-6)}
                  </span>
                </div>
                <button
                  onClick={() => { logout?.(); setMenuOpen(false); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { login?.(); setMenuOpen(false); }}
              className="btn-western w-full px-4 py-3 text-sm rounded-lg mt-2"
            >
              Connect Wallet
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
