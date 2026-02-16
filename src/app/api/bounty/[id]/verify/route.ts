import { NextResponse } from 'next/server';

// Verification is now done on-chain via MeatboardEscrow.approveBounty() / rejectBounty()
export async function POST() {
  return NextResponse.json(
    {
      error: 'Verify bounties on-chain. Call MeatboardEscrow.approveBounty(bountyId) or rejectBounty(bountyId) directly.',
      code: 'USE_CONTRACT',
      instructions: 'Use wagmi/viem to call approveBounty or rejectBounty on the MeatboardEscrow contract.',
    },
    { status: 400 },
  );
}
