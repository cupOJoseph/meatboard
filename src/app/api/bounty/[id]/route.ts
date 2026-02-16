import { NextRequest, NextResponse } from 'next/server';
import { queryGraph } from '@/lib/graph';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const data = await queryGraph<{
      bounty: {
        id: string;
        title: string;
        description: string | null;
        reward: string;
        deadline: string;
        proofType: string;
        locationLat: string | null;
        locationLng: string | null;
        locationRadius: string | null;
        status: string;
        agent: string;
        claimer: string | null;
        claimedAt: string | null;
        proofUrl: string | null;
        submittedAt: string | null;
        escrowTx: string | null;
        payoutTx: string | null;
        createdAt: string;
        expiresAt: string;
        verifiedAt: string | null;
        paidAt: string | null;
      } | null;
    }>(
      `query getBounty($id: ID!) {
        bounty(id: $id) {
          id title description reward deadline proofType locationLat locationLng locationRadius
          status agent claimer claimedAt proofUrl submittedAt escrowTx payoutTx createdAt expiresAt verifiedAt paidAt
        }
      }`,
      { id },
    );

    if (!data.bounty) {
      return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const b = data.bounty;
    const ts = (v: string | null) => (v ? new Date(parseInt(v) * 1000).toISOString() : undefined);

    return NextResponse.json({
      id: b.id,
      title: b.title,
      description: b.description,
      reward: parseFloat(b.reward) / 1e6,
      deadline: b.deadline,
      proof_type: b.proofType,
      location:
        b.locationLat != null
          ? { lat: parseFloat(b.locationLat), lng: parseFloat(b.locationLng!), radius_m: b.locationRadius ? parseFloat(b.locationRadius) : undefined }
          : undefined,
      status: b.status,
      agent_id: b.agent,
      agent_wallet: b.agent,
      claimer_id: b.claimer,
      claimed_at: ts(b.claimedAt),
      proof_url: b.proofUrl,
      submitted_at: ts(b.submittedAt),
      escrow_tx: b.escrowTx,
      payout_tx: b.payoutTx,
      created_at: ts(b.createdAt),
      expires_at: ts(b.expiresAt),
      verified_at: ts(b.verifiedAt),
      paid_at: ts(b.paidAt),
    });
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json({ error: 'Failed to fetch bounty', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// DELETE — cancellation is now done on-chain
export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Cancel bounties on-chain. Call MeatboardEscrow.cancelBounty() directly.',
      code: 'USE_CONTRACT',
    },
    { status: 400 },
  );
}
