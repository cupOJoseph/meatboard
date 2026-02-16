import { NextRequest, NextResponse } from 'next/server';
import { queryGraph } from '@/lib/graph';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const data = await queryGraph<{
      bounty: { id: string; status: string; claimer: string | null; proofURI: string | null } | null;
    }>(`query getBountyStatus($id: ID!) {
      bounty(id: $id) { id status claimer proofURI }
    }`, { id });

    if (!data.bounty) {
      return NextResponse.json({ error: 'Bounty not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      id: data.bounty.id,
      status: data.bounty.status,
      claimer: data.bounty.claimer,
      proof_uri: data.bounty.proofURI,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch status', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
