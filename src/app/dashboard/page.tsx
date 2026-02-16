'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';

interface ApiBounty {
  id: string;
  title: string;
  reward: number;
  status: string;
  agent_id: string;
  claimer_id?: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [bounties, setBounties] = useState<ApiBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'claimed' | 'posted'>('claimed');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

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

  const walletAddress = user?.wallet?.address;

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const fetchBounties = useCallback(async () => {
    try {
      const res = await fetch('/api/bounty');
      if (!res.ok) return;
      const data = await res.json();
      setBounties(data.bounties || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchBounties();
  }, [authenticated, fetchBounties]);

  const handleGenerateKey = async () => {
    if (!walletAddress) return;
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/user/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.api_key);
      }
    } catch {
      // ignore
    } finally {
      setGeneratingKey(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  // Simple role assignment based on wallet
  const myBounties = bounties.map((b) => ({
    ...b,
    role: (b.agent_id === walletAddress?.toLowerCase() ? 'agent' : b.claimer_id ? 'claimer' : null) as 'agent' | 'claimer' | null,
  }));

  const filteredBounties = myBounties.filter((b) =>
    activeTab === 'claimed' ? b.role === 'claimer' : b.role === 'agent'
  );

  const totalEarned = myBounties
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
              {myBounties.filter((b) => !['paid', 'expired', 'cancelled'].includes(b.status)).length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-gray-500 text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold text-purple-600">
              {myBounties.filter((b) => b.status === 'paid').length}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">Wallet</div>
              <div className="font-mono text-gray-900 text-sm">
                {walletAddress || user?.email?.address || 'Not connected'}
              </div>
            </div>
            <button className="btn-western px-4 py-2 text-sm rounded-lg">Withdraw USDC</button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="text-gray-500 text-sm mb-1">API Key</div>
              <div className="font-mono text-gray-400 text-sm">
                {apiKey || '••••••••••••••••'}
              </div>
            </div>
            <button
              onClick={handleGenerateKey}
              disabled={generatingKey}
              className="btn-secondary px-4 py-2 text-sm rounded-lg border-gray-200 disabled:opacity-50"
            >
              {generatingKey ? 'Generating...' : 'Generate Key'}
            </button>
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
                      {new Date(bounty.created_at).toLocaleDateString()}
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
