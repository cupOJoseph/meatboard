import { NextResponse } from 'next/server';

// Submission is now done on-chain via MeatboardEscrow.submitBounty()
export async function POST() {
  return NextResponse.json(
    {
      error: 'Submit proof on-chain. Call MeatboardEscrow.submitBounty(bountyId, proofHash) directly.',
      code: 'USE_CONTRACT',
      instructions: 'Upload proof to IPFS, then call submitBounty with the IPFS hash on the MeatboardEscrow contract.',
    },
    { status: 400 },
  );
}
