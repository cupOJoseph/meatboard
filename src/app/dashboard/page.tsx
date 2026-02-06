'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';

interface UserBounty {
  id: string;
  title: string;
  reward: number;
  status: string;
  role: 'claimer' | 'agent';
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [bounties, setBounties] = useState<UserBounty[]>([]);
  const [activeTab, setActiveTab] = useState<'claimed' | 'posted'>('claimed');
  
  let authenticated = false;
  let ready = true;
  let user: { wallet?: { address?: string }; email?: { address?: string } } | null = null;

  try {
    const privy = usePrivy();
    authenticated = privy.authenticated;
    ready = privy.ready;
    user = privy.user;
  } catch {
    // Privy not available
  }

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Mock data
  useEffect(() => {
    setBounties([
      {
        id: 'bounty_1',
        title: 'Photo of Times Square billboard',
        reward: 5.0,
        status: 'submitted',
        role: 'claimer',
        created_at: new Date().toISOString(),
      },
      {
        id: 'bounty_2',
        title: 'Verify store hours at 123 Main',
        reward: 2.5,
        status: 'paid',
        role: 'claimer',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  const filteredBounties = bounties.filter((b) =>
    activeTab === 'claimed' ? b.role === 'claimer' : b.role === 'agent'
  );

  const totalEarned = bounties
    .filter((b) => b.role === 'claimer' && b.status === 'paid')
    .reduce((sum, b) => sum + b.reward, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats */}
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

        {/* Wallet */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Wallet</div>
              <div className="font-mono text-gray-900 text-sm">
                {user?.wallet?.address || user?.email?.address || 'Not connected'}
              </div>
            </div>
            <button className="btn-western px-4 py-2 text-sm rounded-lg">
              Withdraw USDC
            </button>
          </div>
        </div>

        {/* API Key (for agents) */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">API Key</div>
              <div className="font-mono text-gray-400 text-sm">
                ••••••••••••••••
              </div>
            </div>
            <button className="btn-secondary px-4 py-2 text-sm rounded-lg border-gray-200">
              Generate Key
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('claimed')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'claimed'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🤠 Claimed Bounties
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

        {/* Bounty List */}
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
                    {new Date(bounty.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    ${bounty.reward.toFixed(2)}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full badge-${bounty.status}`}>
                    {bounty.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
