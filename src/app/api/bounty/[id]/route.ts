import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateApiKey } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: { agent: { select: { id: true, address: true } } },
  });

  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    id: bounty.id,
    title: bounty.title,
    description: bounty.description,
    reward: bounty.reward,
    deadline: bounty.deadline,
    proof_type: bounty.proofType,
    location: bounty.locationLat != null ? { lat: bounty.locationLat, lng: bounty.locationLng, radius_m: bounty.locationRadius } : undefined,
    status: bounty.status,
    agent_id: bounty.agentId,
    agent_wallet: bounty.agent.address,
    claimer_id: bounty.claimerId,
    claimed_at: bounty.claimedAt?.toISOString(),
    proof_url: bounty.proofUrl,
    submitted_at: bounty.submittedAt?.toISOString(),
    escrow_tx: bounty.escrowTx,
    payout_tx: bounty.payoutTx,
    created_at: bounty.createdAt.toISOString(),
    expires_at: bounty.expiresAt.toISOString(),
    verified_at: bounty.verifiedAt?.toISOString(),
    paid_at: bounty.paidAt?.toISOString(),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await validateApiKey(request.headers.get('Authorization'));
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const bounty = await prisma.bounty.findUnique({ where: { id } });
  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (bounty.agentId !== userId) {
    return NextResponse.json({ error: 'Not your bounty', code: 'FORBIDDEN' }, { status: 403 });
  }
  if (bounty.status !== 'open') {
    return NextResponse.json({ error: 'Can only cancel open bounties', code: 'INVALID_STATUS' }, { status: 400 });
  }

  const updated = await prisma.bounty.update({
    where: { id },
    data: { status: 'cancelled' },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
