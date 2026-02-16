import { NextResponse } from 'next/server';

// Claiming is now done on-chain via MeatboardEscrow.claimBounty()
export async function POST() {
  return NextResponse.json(
    {
      error: 'Claim bounties on-chain. Call MeatboardEscrow.claimBounty(bountyId) directly.',
      code: 'USE_CONTRACT',
      instructions: 'Use wagmi/viem to call the claimBounty function on the MeatboardEscrow contract.',
    },
    { status: 400 },
  );
}
