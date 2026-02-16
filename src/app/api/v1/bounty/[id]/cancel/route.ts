import { NextRequest, NextResponse } from 'next/server';
import { buildCancelBountyTransaction } from '@/lib/calldata';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tx = buildCancelBountyTransaction(BigInt(id));
    return NextResponse.json({ transaction: tx });
  } catch {
    return NextResponse.json({ error: 'Failed to build cancel transaction', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
