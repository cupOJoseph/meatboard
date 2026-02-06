import { NextRequest, NextResponse } from 'next/server';
import { VerifyBountyRequest } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Check auth
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing authorization header', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  try {
    const body: VerifyBountyRequest = await request.json();
    
    if (body.approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: approved', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }
    
    if (body.approved) {
      // TODO: Trigger USDC payout from escrow
      return NextResponse.json({
        id,
        status: 'paid',
        verified_at: new Date().toISOString(),
        payout_tx: '0x' + Math.random().toString(16).slice(2, 66),
        note: body.note,
      });
    } else {
      // Rejected - refund to agent
      return NextResponse.json({
        id,
        status: 'cancelled',
        verified_at: new Date().toISOString(),
        refund_tx: '0x' + Math.random().toString(16).slice(2, 66),
        note: body.note,
      });
    }
    
  } catch (error) {
    console.error('Error verifying bounty:', error);
    return NextResponse.json(
      { error: 'Failed to verify bounty', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
