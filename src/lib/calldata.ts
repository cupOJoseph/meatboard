/**
 * Transaction builder — encodes calldata for MeatboardEscrow contract functions.
 */
import { encodeFunctionData } from 'viem';

const CHAIN_ID = 42161; // Arbitrum One

function getEscrowAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
  if (!addr) throw new Error('NEXT_PUBLIC_ESCROW_ADDRESS not configured');
  return addr as `0x${string}`;
}

// Minimal ABI fragments — no need to import the full compiled artifact
const escrowAbi = [
  {
    name: 'createBounty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [{ name: 'id', type: 'uint256' }],
  },
  {
    name: 'releaseBounty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelBounty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimBounty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'submitProof',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'proofURI', type: 'string' },
    ],
    outputs: [],
  },
] as const;

const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface UnsignedTx {
  to: string;
  data: string;
  value: string;
  chainId: number;
}

// --- Builders ---

export function buildApproveTransaction(
  tokenAddress: `0x${string}`,
  amount: bigint,
): UnsignedTx {
  return {
    to: tokenAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [getEscrowAddress(), amount],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}

export function buildCreateBountyTransaction(
  token: `0x${string}`,
  amount: bigint,
  deadline: bigint,
  metadataURI: string,
): UnsignedTx {
  return {
    to: getEscrowAddress(),
    data: encodeFunctionData({
      abi: escrowAbi,
      functionName: 'createBounty',
      args: [token, amount, deadline, metadataURI],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}

export function buildReleaseBountyTransaction(bountyId: bigint): UnsignedTx {
  return {
    to: getEscrowAddress(),
    data: encodeFunctionData({
      abi: escrowAbi,
      functionName: 'releaseBounty',
      args: [bountyId],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}

export function buildCancelBountyTransaction(bountyId: bigint): UnsignedTx {
  return {
    to: getEscrowAddress(),
    data: encodeFunctionData({
      abi: escrowAbi,
      functionName: 'cancelBounty',
      args: [bountyId],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}

export function buildClaimBountyTransaction(bountyId: bigint): UnsignedTx {
  return {
    to: getEscrowAddress(),
    data: encodeFunctionData({
      abi: escrowAbi,
      functionName: 'claimBounty',
      args: [bountyId],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}

export function buildSubmitProofTransaction(bountyId: bigint, proofURI: string): UnsignedTx {
  return {
    to: getEscrowAddress(),
    data: encodeFunctionData({
      abi: escrowAbi,
      functionName: 'submitProof',
      args: [bountyId, proofURI],
    }),
    value: '0',
    chainId: CHAIN_ID,
  };
}
