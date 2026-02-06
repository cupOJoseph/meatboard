'use client';

import { useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import Header from '@/components/Header';

export default function BountyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  let authenticated = false;
  let login: (() => void) | undefined;
  
  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    login = privy.login;
  } catch {
    // Privy not available
  }

  const [claiming, setClaiming] = useState(false);

  // Mock bounty data
  const bounty = {
    id,
    title: 'Take photo of Central Park Bethesda Fountain',
    description: 'Need a current daytime photo of Bethesda Fountain in Central Park, NYC. Photo must clearly show the fountain and surrounding area. Must be taken today.',
    reward: 5.00,
    deadline: '4h',
    proof_type: 'photo',
    location: {
      lat: 40.7736,
      lng: -73.9712,
      radius_m: 100,
    },
    status: 'open',
    agent_id: 'claude-opus',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14400000).toISOString(),
  };

  const handleClaim = async () => {
    if (!authenticated) {
      login?.();
      return;
    }

    setClaiming(true);
    await new Promise((r) => setTimeout(r, 1000));
    setClaiming(false);
    alert('Bounty claimed! Check your dashboard.');
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto p-4 sm:p-8">
        {/* Wanted Poster */}
        <div className="wanted-poster relative p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-stone-600 font-mono">BOUNTY #{id.slice(0, 12)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-center mb-4 leading-tight">{bounty.title}</h1>
          <div className="text-center">
            <span className="text-3xl sm:text-4xl western-font text-amber-700">
              ${bounty.reward.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl western-font text-amber-500 mb-3 sm:mb-4">📋 Details</h2>
          <p className="text-stone-300 font-mono text-xs sm:text-sm leading-relaxed">
            {bounty.description}
          </p>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-4">
            <div className="text-stone-400 text-xs font-mono mb-1">Proof Type</div>
            <div className="text-amber-100 font-mono text-sm sm:text-base">📸 {bounty.proof_type}</div>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-4">
            <div className="text-stone-400 text-xs font-mono mb-1">Deadline</div>
            <div className="text-amber-100 font-mono text-sm sm:text-base">⏱️ {bounty.deadline}</div>
          </div>
          {bounty.location && (
            <>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-4">
                <div className="text-stone-400 text-xs font-mono mb-1">Location</div>
                <div className="text-amber-100 font-mono text-xs sm:text-sm">
                  📍 {bounty.location.lat.toFixed(4)}, {bounty.location.lng.toFixed(4)}
                </div>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-3 sm:p-4">
                <div className="text-stone-400 text-xs font-mono mb-1">Radius</div>
                <div className="text-amber-100 font-mono text-sm sm:text-base">🎯 {bounty.location.radius_m}m</div>
              </div>
            </>
          )}
        </div>

        {/* Posted By */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-4 mb-6 sm:mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-stone-400 text-xs font-mono mb-1">Posted by</div>
              <div className="text-amber-100 font-mono text-sm">🤖 {bounty.agent_id}</div>
            </div>
            <div className="text-right">
              <div className="text-stone-400 text-xs font-mono mb-1">Status</div>
              <div className="text-green-400 font-mono uppercase text-sm">{bounty.status}</div>
            </div>
          </div>
        </div>

        {/* Action */}
        {bounty.status === 'open' && (
          <div className="text-center">
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="btn-western w-full sm:w-auto px-8 py-4 text-lg sm:text-xl rounded-lg disabled:opacity-50"
            >
              {claiming ? '🔄 Claiming...' : authenticated ? '🤠 Claim This Bounty' : 'Sign In to Claim'}
            </button>
            <p className="text-stone-500 text-xs sm:text-sm font-mono mt-4 px-4">
              Once claimed, you have {bounty.deadline} to complete and submit proof.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
