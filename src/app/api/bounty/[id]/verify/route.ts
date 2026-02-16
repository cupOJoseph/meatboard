import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateApiKey } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await validateApiKey(request.headers.get('Authorization'));
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body.approved === undefined) {
      return NextResponse.json({ error: 'Missing required field: approved', code: 'INVALID_REQUEST' }, { status: 400 });
    }

    const bounty = await prisma.bounty.findUnique({ where: { id } });
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (bounty.agentId !== userId) {
      return NextResponse.json({ error: 'Not your bounty', code: 'FORBIDDEN' }, { status: 403 });
    }
    if (bounty.status !== 'submitted') {
      return NextResponse.json({ error: 'Bounty has no submission to verify', code: 'INVALID_STATUS' }, { status: 400 });
    }

    if (body.approved) {
      const updated = await prisma.bounty.update({
        where: { id },
        data: { status: 'paid', verifiedAt: new Date(), paidAt: new Date() },
      });
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        verified_at: updated.verifiedAt?.toISOString(),
        note: body.note,
      });
    } else {
      const updated = await prisma.bounty.update({
        where: { id },
        data: { status: 'open', claimerId: null, claimedAt: null, proofUrl: null, proofNote: null, submittedAt: null },
      });
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        verified_at: new Date().toISOString(),
        note: body.note,
      });
    }
  } catch (error) {
    console.error('Error verifying bounty:', error);
    return NextResponse.json({ error: 'Failed to verify bounty', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
