'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';

interface ApiBounty {
  id: string;
  title: string;
  reward: number;
  status: string;
  agent: string;
  claimer: string | null;
  createdAt: string;
  role?: 'agent' | 'claimer' | null;
}

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/meatboard/meatboard';

export default function DashboardPage() {
  const router = useRouter();
  const [bounties, setBounties] = useState<ApiBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'claimed' | 'posted'>('claimed');

  const { isConnected, address } = useAccount();
  const walletAddress = address?.toLowerCase();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const fetchBounties = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            asAgent: bounties(where: { agent: "${walletAddress}" }, orderBy: createdAt, orderDirection: desc) {
              id title reward status agent claimer createdAt
            }
            asClaimer: bounties(where: { claimer: "${walletAddress}" }, orderBy: createdAt, orderDirection: desc) {
              id title reward status agent claimer createdAt
            }
          }`,
        }),
      });
      const json = await res.json();
      const agentBounties = (json.data?.asAgent || []).map((b: ApiBounty) => ({
        ...b,
        reward: parseFloat(b.reward as unknown as string) / 1e6,
        role: 'agent' as const,
      }));
      const claimerBounties = (json.data?.asClaimer || []).map((b: ApiBounty) => ({
        ...b,
        reward: parseFloat(b.reward as unknown as string) / 1e6,
        role: 'claimer' as const,
      }));
      const seen = new Set<string>();
      const all: ApiBounty[] = [];
      for (const b of [...claimerBounties, ...agentBounties]) {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          all.push(b);
        }
      }
      setBounties(all);
    } catch (err) { console.error(err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && walletAddress) fetchBounties();
  }, [isConnected, walletAddress, fetchBounties]);

  if (!isConnected) return null;

  const filteredBounties = bounties.filter((b) =>
    activeTab === 'claimed' ? b.role === 'claimer' : b.role === 'agent',
  );

  const totalEarned = bounties
    .filter((b) => b.role === 'claimer' && b.status === 'paid')
    .reduce((sum, b) => sum + b.reward, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-gray-500 text-sm mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-gray-500 text-sm mb-1">Active</div>
            <div className="text-2xl font-bold text-amber-600">
              {bounties.filter((b) => !['paid', 'expired', 'cancelled'].includes(b.status)).length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-gray-500 text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold text-purple-600">
              {bounties.filter((b) => b.status === 'paid').length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Wallet</div>
              <div className="font-mono text-gray-900 text-sm">
                {walletAddress || 'Not connected'}
              </div>
            </div>
            <button className="btn-western px-4 py-2 text-sm rounded-lg">Withdraw USDC</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('claimed')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'claimed'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🥩 Claimed Bounties
          </button>
          <button
            onClick={() => setActiveTab('posted')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posted'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🤖 Posted Bounties
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-3">
            {filteredBounties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No {activeTab} bounties yet
              </div>
            ) : (
              filteredBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-gray-900">{bounty.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(parseInt(bounty.createdAt) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">${bounty.reward.toFixed(2)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full badge-${bounty.status}`}>
                      {bounty.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
