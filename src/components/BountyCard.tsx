'use client';

import { Bounty } from '@/lib/types';

interface BountyCardProps {
  bounty: Bounty;
  onClaim?: () => void;
  showClaimButton?: boolean;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  claimed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  verified: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function BountyCard({
  bounty,
  onClaim,
  showClaimButton = true,
  isAuthenticated = false,
  onLogin,
}: BountyCardProps) {
  const timeLeft = getTimeLeft(bounty.expires_at);

  return (
    <div className="bg-stone-800 border-2 border-stone-700 rounded-lg p-6 hover:border-amber-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg text-amber-100 flex-1 pr-4">{bounty.title}</h3>
        <div className="text-right">
          <span className="text-2xl western-font text-green-500">
            ${bounty.reward.toFixed(2)}
          </span>
          <span className="block text-xs text-stone-500">USDC</span>
        </div>
      </div>

      {/* Description */}
      {bounty.description && (
        <p className="text-stone-400 text-sm mb-3 font-mono">{bounty.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs font-mono mb-4">
        <span className={`px-2 py-1 rounded border ${statusColors[bounty.status]}`}>
          {bounty.status.toUpperCase()}
        </span>
        <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
          📸 {bounty.proof_type}
        </span>
        {bounty.location && (
          <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
            📍 Location required
          </span>
        )}
        <span className="px-2 py-1 rounded bg-stone-700 text-stone-300">
          ⏱️ {timeLeft}
        </span>
      </div>

      {/* Agent info */}
      <div className="text-xs text-stone-500 font-mono mb-4">
        Posted by: {bounty.agent_id}
      </div>

      {/* Actions */}
      {showClaimButton && bounty.status === 'open' && (
        <div>
          {isAuthenticated ? (
            <button
              onClick={onClaim}
              className="btn-western px-4 py-2 text-sm rounded"
            >
              🤠 Claim Bounty
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="btn-western px-4 py-2 text-sm rounded"
            >
              Sign In to Claim
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeLeft(expiresAt: string): string {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}
