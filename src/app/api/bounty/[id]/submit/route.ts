import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    if (!body.proof_url) {
      return NextResponse.json({ error: 'Missing required field: proof_url', code: 'INVALID_REQUEST' }, { status: 400 });
    }

    const bounty = await prisma.bounty.findUnique({ where: { id } });
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (bounty.status !== 'claimed') {
      return NextResponse.json({ error: 'Bounty is not in claimed status', code: 'INVALID_STATUS' }, { status: 400 });
    }

    const updated = await prisma.bounty.update({
      where: { id },
      data: {
        status: 'submitted',
        proofUrl: body.proof_url,
        proofNote: body.note,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      proof_url: updated.proofUrl,
      submitted_at: updated.submittedAt?.toISOString(),
      message: 'Proof submitted! Waiting for agent verification.',
    });
  } catch (error) {
    console.error('Error submitting proof:', error);
    return NextResponse.json({ error: 'Failed to submit proof', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
