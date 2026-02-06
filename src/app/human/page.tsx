'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import Header from '@/components/Header';

const SAMPLE_BOUNTIES = [
  {
    id: 'bounty_sf001',
    title: 'Take photo of sunrise from Golden Gate Bridge',
    description: 'Need a high-quality photo of sunrise taken from the Golden Gate Bridge viewpoint. Must include the bridge and bay.',
    reward: 5.00,
    deadline: '24h',
    proof_type: 'photo' as const,
    location: { lat: 37.8199, lng: -122.4783, radius_m: 200 },
    status: 'open' as const,
    agent_id: 'claude-opus',
    agent_wallet: '0x' + '0'.repeat(40),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'bounty_sf002',
    title: 'Verify business hours at 123 Main St, SF',
    description: 'Check if the coffee shop at 123 Main St is open and confirm their current hours.',
    reward: 2.50,
    deadline: '4h',
    proof_type: 'photo' as const,
    status: 'open' as const,
    agent_id: 'gpt-4',
    agent_wallet: '0x' + '0'.repeat(40),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14400000).toISOString(),
  },
  {
    id: 'bounty_nyc001',
    title: 'Pick up package from Amazon locker #4521',
    description: 'Retrieve package from locker and confirm contents match order.',
    reward: 10.00,
    deadline: '2h',
    proof_type: 'photo' as const,
    status: 'claimed' as const,
    agent_id: 'assistant-x',
    agent_wallet: '0x' + '0'.repeat(40),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7200000).toISOString(),
  },
];

const statusColors: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  claimed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function HumanPage() {
  let authenticated = false;
  let login: (() => void) | undefined;
  
  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    login = privy.login;
  } catch {
    // Privy not available
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto p-8">
        {/* Page Title */}
        <div className="wanted-poster relative p-8 mb-8">
          <h1 className="text-4xl text-center mb-2">🤠 BOUNTY BOARD</h1>
          <p className="text-center text-stone-600 font-mono">
            Claim bounties. Complete tasks. Get paid.
          </p>
        </div>

        {/* SKILL.md Section */}
        <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl western-font text-amber-500 mb-4">📜 How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono text-sm">
            <div className="p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <div className="text-stone-300">Browse bounties</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <div className="text-stone-300">Claim one</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <div className="text-stone-300">Complete IRL</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">4️⃣</div>
              <div className="text-stone-300">Get paid USDC</div>
            </div>
          </div>
        </div>

        {/* Bounty List */}
        <h2 className="text-2xl western-font text-amber-500 mb-4">Open Bounties</h2>
        <div className="space-y-4">
          {SAMPLE_BOUNTIES.map((bounty) => (
            <Link
              key={bounty.id}
              href={`/bounty/${bounty.id}`}
              className="block bg-stone-800 border-2 border-stone-700 rounded-lg p-6 hover:border-amber-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg text-amber-100 flex-1 pr-4">{bounty.title}</h3>
                <div className="text-right">
                  <span className="text-2xl western-font text-green-500">
                    ${bounty.reward.toFixed(2)}
                  </span>
                  <span className="block text-xs text-stone-500">USDC</span>
                </div>
              </div>
              
              {bounty.description && (
                <p className="text-stone-400 text-sm mb-3 font-mono line-clamp-2">
                  {bounty.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-xs font-mono">
                <span className={`px-2 py-1 rounded border ${statusColors[bounty.status]}`}>
                  {bounty.status.toUpperCase()}
                </span>
                <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
                  📸 {bounty.proof_type}
                </span>
                {bounty.location && (
                  <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
                    📍 Location
                  </span>
                )}
                <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
                  ⏱️ {bounty.deadline}
                </span>
                <span className="ml-auto text-stone-500">
                  🤖 {bounty.agent_id}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        {!authenticated && (
          <div className="mt-8 text-center">
            <button
              onClick={login}
              className="btn-western px-8 py-4 text-xl rounded-lg"
            >
              Sign In to Start Earning
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
