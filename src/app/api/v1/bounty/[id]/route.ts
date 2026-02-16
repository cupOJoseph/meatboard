import { NextRequest, NextResponse } from 'next/server';
import { queryGraph } from '@/lib/graph';

function errorResponse(error: string, code: string, status = 400) {
  return NextResponse.json({ error, code }, { status });
}

// GET /api/v1/bounty/:id — bounty detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const data = await queryGraph<{
      bounty: {
        id: string;
        agent: string;
        claimer: string | null;
        token: string;
        amount: string;
        deadline: string;
        status: string;
        metadataURI: string;
        proofURI: string | null;
        payout: string | null;
        fee: string | null;
        createdAt: string;
        claimedAt: string | null;
        submittedAt: string | null;
        paidAt: string | null;
        cancelledAt: string | null;
      } | null;
    }>(`query getBounty($id: ID!) {
      bounty(id: $id) {
        id agent claimer token amount deadline status metadataURI proofURI
        payout fee createdAt claimedAt submittedAt paidAt cancelledAt
      }
    }`, { id });

    if (!data.bounty) {
      return errorResponse('Bounty not found', 'NOT_FOUND', 404);
    }

    return NextResponse.json(data.bounty);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return errorResponse('Failed to fetch bounty', 'INTERNAL_ERROR', 500);
  }
}
