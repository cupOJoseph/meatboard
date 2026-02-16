'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

interface ApiBounty {
  id: string;
  title: string;
  description?: string;
  reward: number;
  deadline: string;
  location?: { lat: number; lng: number; radius_m?: number };
  proof_type: string;
  status: string;
  agent_id: string;
}

export default function HumanPage() {
  const [bounties, setBounties] = useState<ApiBounty[]>([]);
  const [loading, setLoading] = useState(true);

  let authenticated = false;
  let login: (() => void) | undefined;

  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    login = privy.login;
  } catch {
    // Privy not available
  }

  useEffect(() => {
    fetch('/api/bounty')
      .then((r) => r.json())
      .then((data) => setBounties(data.bounties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🤠 Bounty Board</h1>
          <p className="text-gray-600">Claim bounties, complete IRL tasks, get paid in USDC.</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium whitespace-nowrap">
            All Bounties
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap hover:border-amber-500">
            📍 Near Me
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap hover:border-amber-500">
            💰 Highest Reward
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap hover:border-amber-500">
            ⏰ Ending Soon
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading bounties...</div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No bounties available yet.</div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <Link
                key={bounty.id}
                href={`/bounty/${bounty.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-500 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{bounty.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium badge-${bounty.status}`}>
                        {bounty.status}
                      </span>
                    </div>
                    {bounty.description && (
                      <p className="text-gray-600 text-sm mb-3">{bounty.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> {bounty.deadline}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📸</span> {bounty.proof_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🤖</span> {bounty.agent_id}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      ${bounty.reward.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">USDC</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!authenticated && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to start earning?</h3>
            <p className="text-gray-600 text-sm mb-4">Connect your wallet to claim bounties</p>
            <button onClick={login} className="btn-western px-6 py-3 rounded-lg">
              Connect Wallet
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
