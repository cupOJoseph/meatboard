import { NextRequest, NextResponse } from 'next/server';
import { buildCancelBountyTransaction } from '@/lib/calldata';

// MVP: dispute == cancel after deadline (contract doesn't have separate dispute logic)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tx = buildCancelBountyTransaction(BigInt(id));
    return NextResponse.json({
      transaction: tx,
      note: 'MVP: disputes are handled via cancelBounty after deadline. Full dispute resolution coming in v2.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to build dispute transaction', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
