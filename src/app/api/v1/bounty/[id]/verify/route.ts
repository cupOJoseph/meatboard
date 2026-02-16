import { NextRequest, NextResponse } from 'next/server';
import { buildReleaseBountyTransaction } from '@/lib/calldata';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: '"approved" (boolean) is required', code: 'MISSING_FIELD' }, { status: 400 });
    }

    if (!approved) {
      // Contract doesn't have a reject function — agent can just not release.
      // Bounty stays in Submitted state; agent can wait for deadline to cancel.
      return NextResponse.json({
        message: 'Bounty not approved. It will remain in Submitted state. You can cancel after the deadline.',
        transaction: null,
      });
    }

    const tx = buildReleaseBountyTransaction(BigInt(id));
    return NextResponse.json({ transaction: tx });
  } catch {
    return NextResponse.json({ error: 'Failed to build verify transaction', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
