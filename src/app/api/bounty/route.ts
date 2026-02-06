import { NextRequest, NextResponse } from 'next/server';
import { CreateBountyRequest, Bounty } from '@/lib/types';

// In-memory store for demo (replace with DB)
const bounties: Map<string, Bounty> = new Map();

// Helper to parse deadline string to timestamp
function parseDeadline(deadline: string): string {
  const now = new Date();
  
  // Check if it's a duration like "2h", "30m", "1d"
  const match = deadline.match(/^(\d+)(m|h|d)$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const ms = unit === 'm' ? value * 60000 
             : unit === 'h' ? value * 3600000 
             : value * 86400000;
    return new Date(now.getTime() + ms).toISOString();
  }
  
  // Otherwise treat as ISO timestamp
  return deadline;
}

// Generate unique ID
function generateId(): string {
  return 'bounty_' + Math.random().toString(36).substring(2, 15);
}

// GET /api/bounty - List all bounties (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let results = Array.from(bounties.values());
  
  if (status) {
    results = results.filter(b => b.status === status);
  }
  
  // Sort by created_at desc
  results.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return NextResponse.json({ bounties: results });
}

// POST /api/bounty - Create a new bounty
export async function POST(request: NextRequest) {
  try {
    // Check auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    const apiKey = authHeader.slice(7);
    
    // TODO: Validate API key and get agent info
    // For now, mock agent info
    const agentId = 'agent_' + apiKey.slice(0, 8);
    const agentWallet = '0x' + '0'.repeat(40); // Placeholder
    
    const body: CreateBountyRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.reward || !body.deadline) {
      return NextResponse.json(
        { error: 'Missing required fields: title, reward, deadline', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }
    
    // Validate reward bounds
    if (body.reward < 1 || body.reward > 1000) {
      return NextResponse.json(
        { error: 'Reward must be between $1 and $1000 USDC', code: 'INVALID_REWARD' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const expiresAt = parseDeadline(body.deadline);
    
    const bounty: Bounty = {
      id: generateId(),
      title: body.title,
      description: body.description,
      reward: body.reward,
      deadline: body.deadline,
      proof_type: body.proof_type || 'photo',
      location: body.location,
      status: 'open',
      agent_id: agentId,
      agent_wallet: agentWallet,
      created_at: now,
      expires_at: expiresAt,
      // TODO: Create escrow transaction
      escrow_tx: '0x' + Math.random().toString(16).slice(2, 66),
    };
    
    bounties.set(bounty.id, bounty);
    
    return NextResponse.json({
      id: bounty.id,
      status: bounty.status,
      escrow_tx: bounty.escrow_tx,
      created_at: bounty.created_at,
      expires_at: bounty.expires_at,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating bounty:', error);
    return NextResponse.json(
      { error: 'Failed to create bounty', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
