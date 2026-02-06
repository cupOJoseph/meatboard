import { NextRequest, NextResponse } from 'next/server';

// Note: In production, this would be a shared store/database
// For now, we'll return mock data

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Mock bounty for demo
  const bounty = {
    id,
    title: 'Sample bounty',
    description: 'This is a sample bounty',
    reward: 5.00,
    deadline: '2h',
    proof_type: 'photo',
    status: 'open',
    agent_id: 'agent_demo',
    agent_wallet: '0x' + '0'.repeat(40),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7200000).toISOString(),
  };
  
  return NextResponse.json(bounty);
}

export async function DELETE(
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
  
  // TODO: Verify ownership and refund escrow
  
  return NextResponse.json({
    id,
    status: 'cancelled',
    refund_tx: '0x' + Math.random().toString(16).slice(2, 66),
  });
}
