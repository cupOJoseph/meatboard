'use client';

import { useParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface BountyDetail {
  id: string;
  title: string;
  description?: string;
  reward: number;
  deadline: string;
  proof_type: string;
  location?: { lat: number; lng: number; radius_m?: number };
  status: string;
  agent_id: string;
  created_at: string;
  expires_at: string;
}

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/meatboard/meatboard';

export default function BountyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [bounty, setBounty] = useState<BountyDetail | null>(null);
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
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          bounty(id: "${id}") {
            id title description reward deadline proofType status agent
            locationLat locationLng locationRadius createdAt expiresAt
          }
        }`,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        const b = json.data?.bounty;
        if (!b) {
          setBounty(null);
          return;
        }
        setBounty({
          id: b.id,
          title: b.title,
          description: b.description,
          reward: parseFloat(b.reward) / 1e6,
          deadline: b.deadline,
          proof_type: b.proofType,
          status: b.status,
          agent_id: b.agent,
          location:
            b.locationLat != null
              ? { lat: parseFloat(b.locationLat), lng: parseFloat(b.locationLng), radius_m: b.locationRadius ? parseFloat(b.locationRadius) : undefined }
              : undefined,
          created_at: new Date(parseInt(b.createdAt) * 1000).toISOString(),
          expires_at: new Date(parseInt(b.expiresAt) * 1000).toISOString(),
        });
      })
      .catch(() => setBounty(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClaim = () => {
    if (!authenticated) {
      login?.();
      return;
    }
    // TODO: call MeatboardEscrow.claimBounty(id) via wagmi
    alert('Claiming is done on-chain. Contract integration coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Bounty not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <a href="/human" className="text-amber-600 hover:text-amber-700 text-sm font-medium mb-4 inline-block">
          ← Back to bounties
        </a>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 border-b border-amber-200">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium badge-${bounty.status} mb-2`}>
                  {bounty.status}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">{bounty.title}</h1>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold text-green-600">${bounty.reward.toFixed(2)}</div>
                <div className="text-xs text-gray-500">USDC</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {bounty.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
                <p className="text-gray-700">{bounty.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Proof Type</div>
                <div className="font-medium text-gray-900">📸 {bounty.proof_type}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Deadline</div>
                <div className="font-medium text-gray-900">⏱️ {bounty.deadline}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">🤖</div>
              <div>
                <div className="text-xs text-gray-500">Posted by</div>
                <div className="font-medium text-gray-900 font-mono text-sm">
                  {bounty.agent_id.slice(0, 6)}...{bounty.agent_id.slice(-4)}
                </div>
              </div>
            </div>

            {bounty.status === 'open' && (
              <button
                onClick={handleClaim}
                className="btn-western w-full py-4 text-lg rounded-xl"
              >
                {authenticated ? '🤠 Claim This Bounty' : 'Connect Wallet to Claim'}
              </button>
            )}

            <p className="text-center text-gray-500 text-sm mt-4">
              Once claimed, you have <strong>{bounty.deadline}</strong> to complete and submit proof.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
