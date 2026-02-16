import { NextRequest, NextResponse } from 'next/server';
import { queryGraph } from '@/lib/graph';
import { resolveToken, parseTokenAmount } from '@/lib/tokens';
import { uploadMetadata } from '@/lib/ipfs';
import { buildCreateBountyTransaction, buildApproveTransaction } from '@/lib/calldata';
import { parseDeadline } from '@/lib/deadline';

function errorResponse(error: string, code: string, status = 400) {
  return NextResponse.json({ error, code }, { status });
}

// GET /api/v1/bounty — list bounties
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const first = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const skip = parseInt(searchParams.get('offset') || '0');

  try {
    const where = status ? `where: { status: "${status}" },` : '';
    const data = await queryGraph<{
      bounties: Array<{
        id: string;
        agent: string;
        token: string;
        amount: string;
        deadline: string;
        status: string;
        metadataURI: string;
        claimer: string | null;
        proofURI: string | null;
        createdAt: string;
      }>;
    }>(`{
      bounties(orderBy: createdAt, orderDirection: desc, first: ${first}, skip: ${skip}, ${where}) {
        id agent token amount deadline status metadataURI claimer proofURI createdAt
      }
    }`);

    return NextResponse.json({ bounties: data.bounties || [] });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return errorResponse('Failed to fetch bounties', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/bounty — agent-friendly bounty creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, reward, token: tokenInput, deadline, proof_type, location, webhook_url } = body;

    // Validate required fields
    if (!title) return errorResponse('title is required', 'MISSING_FIELD');
    if (!reward) return errorResponse('reward is required', 'MISSING_FIELD');
    if (!deadline) return errorResponse('deadline is required', 'MISSING_FIELD');

    // Resolve token
    const tokenInfo = resolveToken(tokenInput || 'USDC');
    if (!tokenInfo) {
      return errorResponse(
        `Unknown token: "${tokenInput}". Use USDC, USDT, DAI, WETH, ARB, or a token address.`,
        'UNKNOWN_TOKEN',
      );
    }

    // Parse amount
    const rewardRaw = parseTokenAmount(String(reward), tokenInfo.decimals);
    if (rewardRaw <= BigInt(0)) return errorResponse('reward must be positive', 'INVALID_AMOUNT');

    // Parse deadline
    let deadlineUnix: number;
    try {
      deadlineUnix = parseDeadline(String(deadline));
    } catch {
      return errorResponse('Invalid deadline format. Use e.g. "4h", "30m", "2d".', 'INVALID_DEADLINE');
    }

    // Upload metadata to IPFS
    const metadataUri = await uploadMetadata({
      title,
      description,
      proofType: proof_type || 'any',
      location,
      webhookUrl: webhook_url,
    });

    // Build transactions
    const approveTx = buildApproveTransaction(tokenInfo.address, rewardRaw);
    const createTx = buildCreateBountyTransaction(
      tokenInfo.address,
      rewardRaw,
      BigInt(deadlineUnix),
      metadataUri,
    );

    return NextResponse.json({
      metadata_uri: metadataUri,
      transaction: createTx,
      approve_transaction: approveTx,
      reward_raw: rewardRaw.toString(),
      token: {
        symbol: tokenInfo.symbol,
        address: tokenInfo.address,
        decimals: tokenInfo.decimals,
      },
      deadline_unix: deadlineUnix,
      instructions: '1. Send approve_transaction first (token approval). 2. Then send transaction (creates bounty).',
    });
  } catch (error) {
    console.error('Error building bounty:', error);
    return errorResponse('Failed to build bounty transaction', 'INTERNAL_ERROR', 500);
  }
}
