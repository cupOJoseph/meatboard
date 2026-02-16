import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateApiKey } from '@/lib/auth';

function parseDeadline(deadline: string): Date {
  const now = new Date();
  const match = deadline.match(/^(\d+)(m|h|d)$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const ms = unit === 'm' ? value * 60000 : unit === 'h' ? value * 3600000 : value * 86400000;
    return new Date(now.getTime() + ms);
  }
  return new Date(deadline);
}

// GET /api/bounty
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where = status ? { status } : {};
  const bounties = await prisma.bounty.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { agent: { select: { id: true, address: true } } },
  });

  return NextResponse.json({
    bounties: bounties.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      reward: b.reward,
      deadline: b.deadline,
      proof_type: b.proofType,
      location: b.locationLat != null ? { lat: b.locationLat, lng: b.locationLng, radius_m: b.locationRadius } : undefined,
      status: b.status,
      agent_id: b.agentId,
      agent_wallet: b.agent.address,
      created_at: b.createdAt.toISOString(),
      expires_at: b.expiresAt.toISOString(),
      escrow_tx: b.escrowTx,
    })),
  });
}

// POST /api/bounty
export async function POST(request: NextRequest) {
  try {
    const userId = await validateApiKey(request.headers.get('Authorization'));
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.reward || !body.deadline) {
      return NextResponse.json({ error: 'Missing required fields: title, reward, deadline', code: 'INVALID_REQUEST' }, { status: 400 });
    }
    if (body.reward < 1 || body.reward > 1000) {
      return NextResponse.json({ error: 'Reward must be between $1 and $1000', code: 'INVALID_REWARD' }, { status: 400 });
    }

    const expiresAt = parseDeadline(body.deadline);
    const bounty = await prisma.bounty.create({
      data: {
        title: body.title,
        description: body.description,
        reward: body.reward,
        deadline: body.deadline,
        expiresAt,
        proofType: body.proof_type || 'photo',
        locationLat: body.location?.lat,
        locationLng: body.location?.lng,
        locationRadius: body.location?.radius_m,
        webhookUrl: body.webhook_url,
        agentId: userId,
        token: body.token || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      },
    });

    return NextResponse.json({
      id: bounty.id,
      status: bounty.status,
      escrow_tx: bounty.escrowTx,
      created_at: bounty.createdAt.toISOString(),
      expires_at: bounty.expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bounty:', error);
    return NextResponse.json({ error: 'Failed to create bounty', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
