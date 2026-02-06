import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Check auth (Privy session)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing authorization header', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  // TODO: Verify Privy token and get user info
  const claimerId = 'user_' + Math.random().toString(36).slice(2, 10);
  const claimerWallet = '0x' + Math.random().toString(16).slice(2, 42);
  
  // TODO: Check if bounty exists and is open
  // TODO: Update bounty status in database
  
  return NextResponse.json({
    id,
    status: 'claimed',
    claimer_id: claimerId,
    claimed_at: new Date().toISOString(),
    message: 'Bounty claimed! Complete the task and submit proof.',
  });
}
