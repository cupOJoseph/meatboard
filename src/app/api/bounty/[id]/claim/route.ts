import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Expect wallet address in body (from Privy-authenticated frontend)
  const body = await request.json().catch(() => ({}));
  const walletAddress = body.wallet_address as string | undefined;
  if (!walletAddress) {
    return NextResponse.json({ error: 'Missing wallet_address', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const bounty = await prisma.bounty.findUnique({ where: { id } });
  if (!bounty) {
    return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (bounty.status !== 'open') {
    return NextResponse.json({ error: 'Bounty is not open', code: 'INVALID_STATUS' }, { status: 400 });
  }

  // Upsert user by wallet address
  const user = await prisma.user.upsert({
    where: { address: walletAddress.toLowerCase() },
    update: {},
    create: { address: walletAddress.toLowerCase() },
  });

  const updated = await prisma.bounty.update({
    where: { id },
    data: { status: 'claimed', claimerId: user.id, claimedAt: new Date() },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    claimer_id: user.id,
    claimed_at: updated.claimedAt?.toISOString(),
    message: 'Bounty claimed! Complete the task and submit proof.',
  });
}
