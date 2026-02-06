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
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();
  const [bounties, setBounties] = useState<UserBounty[]>([]);
  const [activeTab, setActiveTab] = useState<'claimed' | 'posted'>('claimed');

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Mock data for demo
  useEffect(() => {
    setBounties([
      {
        id: '1',
        title: 'Photo of Times Square',
        reward: 5.0,
        status: 'submitted',
        role: 'claimer',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Verify store hours',
        reward: 2.5,
        status: 'paid',
        role: 'claimer',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 font-mono">Loading...</div>
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
    <div className="min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <div className="text-stone-400 text-sm font-mono mb-1">Total Earned</div>
            <div className="text-3xl western-font text-green-500">
              ${totalEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <div className="text-stone-400 text-sm font-mono mb-1">Active Bounties</div>
            <div className="text-3xl western-font text-amber-500">
              {bounties.filter((b) => !['paid', 'expired', 'cancelled'].includes(b.status)).length}
            </div>
          </div>
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
            <div className="text-stone-400 text-sm font-mono mb-1">Completed</div>
            <div className="text-3xl western-font text-purple-500">
              {bounties.filter((b) => b.status === 'paid').length}
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-stone-400 text-sm font-mono mb-1">Your Wallet</div>
              <div className="text-amber-100 font-mono">
                {user?.wallet?.address || 'No wallet connected'}
              </div>
            </div>
            <button className="btn-western px-4 py-2 text-sm rounded">
              Withdraw USDC
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-stone-700">
          <button
            onClick={() => setActiveTab('claimed')}
            className={`pb-3 px-2 font-mono text-sm border-b-2 transition-colors ${
              activeTab === 'claimed'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-stone-400 hover:text-amber-400'
            }`}
          >
            🤠 Claimed Bounties
          </button>
          <button
            onClick={() => setActiveTab('posted')}
            className={`pb-3 px-2 font-mono text-sm border-b-2 transition-colors ${
              activeTab === 'posted'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-stone-400 hover:text-amber-400'
            }`}
          >
            🤖 Posted Bounties
          </button>
        </div>

        {/* Bounty List */}
        <div className="space-y-4">
          {filteredBounties.length === 0 ? (
            <div className="text-center py-12 text-stone-500 font-mono">
              No {activeTab} bounties yet
            </div>
          ) : (
            filteredBounties.map((bounty) => (
              <div
                key={bounty.id}
                className="bg-stone-800 border border-stone-700 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="text-amber-100 mb-1">{bounty.title}</div>
                  <div className="text-xs text-stone-500 font-mono">
                    {new Date(bounty.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg western-font text-green-500">
                    ${bounty.reward.toFixed(2)}
                  </div>
                  <div className="text-xs text-stone-400 font-mono uppercase">
                    {bounty.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
