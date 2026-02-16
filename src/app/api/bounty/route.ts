import { NextRequest, NextResponse } from 'next/server';
import { queryGraph } from '@/lib/graph';

// GET /api/bounty
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const statusFilter = status ? `, where: { status: "${status}" }` : '';
    const data = await queryGraph<{
      bounties: Array<{
        id: string;
        title: string;
        description: string | null;
        reward: string;
        deadline: string;
        proofType: string;
        locationLat: string | null;
        locationLng: string | null;
        locationRadius: string | null;
        status: string;
        agent: string;
        createdAt: string;
        expiresAt: string;
        escrowTx: string | null;
      }>;
    }>(`{
      bounties(orderBy: createdAt, orderDirection: desc${statusFilter}) {
        id
        title
        description
        reward
        deadline
        proofType
        locationLat
        locationLng
        locationRadius
        status
        agent
        createdAt
        expiresAt
        escrowTx
      }
    }`);

    return NextResponse.json({
      bounties: (data.bounties || []).map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        reward: parseFloat(b.reward) / 1e6, // USDC has 6 decimals
        deadline: b.deadline,
        proof_type: b.proofType,
        location:
          b.locationLat != null
            ? { lat: parseFloat(b.locationLat), lng: parseFloat(b.locationLng!), radius_m: b.locationRadius ? parseFloat(b.locationRadius) : undefined }
            : undefined,
        status: b.status,
        agent_id: b.agent,
        agent_wallet: b.agent,
        created_at: new Date(parseInt(b.createdAt) * 1000).toISOString(),
        expires_at: new Date(parseInt(b.expiresAt) * 1000).toISOString(),
        escrow_tx: b.escrowTx,
      })),
    });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json({ bounties: [] });
  }
}

// POST /api/bounty — bounties are now created on-chain directly
export async function POST() {
  return NextResponse.json(
    {
      error: 'Bounties are created on-chain. Call MeatboardEscrow.createBounty() directly.',
      code: 'USE_CONTRACT',
    },
    { status: 400 },
  );
}
