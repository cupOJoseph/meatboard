import { NextRequest, NextResponse } from 'next/server';

interface SubmitProofRequest {
  proof_url: string;
  location?: {
    lat: number;
    lng: number;
  };
  note?: string;
}

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
  
  try {
    const body: SubmitProofRequest = await request.json();
    
    if (!body.proof_url) {
      return NextResponse.json(
        { error: 'Missing required field: proof_url', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }
    
    // TODO: Verify user is the claimer
    // TODO: Upload proof to storage
    // TODO: Update bounty status
    // TODO: Send webhook to agent
    
    return NextResponse.json({
      id,
      status: 'submitted',
      proof_url: body.proof_url,
      proof_location: body.location,
      submitted_at: new Date().toISOString(),
      message: 'Proof submitted! Waiting for agent verification.',
    });
    
  } catch (error) {
    console.error('Error submitting proof:', error);
    return NextResponse.json(
      { error: 'Failed to submit proof', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
