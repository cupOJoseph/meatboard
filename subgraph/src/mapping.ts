import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  BountyCreated,
  BountyClaimed,
  BountySubmitted,
  BountyPaid,
  BountyCancelled,
} from '../generated/MeatboardEscrow/MeatboardEscrow';
import { Bounty, AgentStats, ClaimerStats } from '../generated/schema';

function getOrCreateAgentStats(address: Bytes): AgentStats {
  let id = address.toHexString();
  let stats = AgentStats.load(id);
  if (!stats) {
    stats = new AgentStats(id);
    stats.totalBounties = 0;
    stats.totalSpent = BigInt.zero();
    stats.activeBounties = 0;
    stats.completedBounties = 0;
    stats.cancelledBounties = 0;
  }
  return stats;
}

function getOrCreateClaimerStats(address: Bytes): ClaimerStats {
  let id = address.toHexString();
  let stats = ClaimerStats.load(id);
  if (!stats) {
    stats = new ClaimerStats(id);
    stats.totalClaimed = 0;
    stats.totalEarned = BigInt.zero();
    stats.completedBounties = 0;
    stats.activeClaims = 0;
  }
  return stats;
}

export function handleBountyCreated(event: BountyCreated): void {
  let bountyId = event.params.param0.toString();
  let bounty = new Bounty(bountyId);

  bounty.onchainId = event.params.param0;
  bounty.agent = event.params.param1;
  bounty.reward = event.params.param2;
  bounty.metadataURI = event.params.param3;
  bounty.expiresAt = event.params.param4;
  bounty.status = 'open';
  bounty.title = ''; // Will be populated from metadata
  bounty.deadline = '';
  bounty.proofType = 'photo';
  bounty.token = Bytes.fromHexString('0xaf88d065e77c8cC2239327C5EDb3A432268e5831');
  bounty.createdAt = event.block.timestamp;
  bounty.escrowTx = event.transaction.hash;
  bounty.save();

  let agentStats = getOrCreateAgentStats(event.params.param1);
  agentStats.totalBounties += 1;
  agentStats.activeBounties += 1;
  agentStats.totalSpent = agentStats.totalSpent.plus(event.params.param2);
  agentStats.save();
}

export function handleBountyClaimed(event: BountyClaimed): void {
  let bountyId = event.params.param0.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'claimed';
  bounty.claimer = event.params.param1;
  bounty.claimedAt = event.block.timestamp;
  bounty.save();

  let claimerStats = getOrCreateClaimerStats(event.params.param1);
  claimerStats.totalClaimed += 1;
  claimerStats.activeClaims += 1;
  claimerStats.save();
}

export function handleBountySubmitted(event: BountySubmitted): void {
  let bountyId = event.params.param0.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'submitted';
  bounty.proofUrl = event.params.param1;
  bounty.submittedAt = event.block.timestamp;
  bounty.save();
}

export function handleBountyPaid(event: BountyPaid): void {
  let bountyId = event.params.param0.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'paid';
  bounty.verifiedAt = event.block.timestamp;
  bounty.paidAt = event.block.timestamp;
  bounty.payoutTx = event.transaction.hash;
  bounty.save();

  // Update agent stats
  let agentStats = getOrCreateAgentStats(bounty.agent);
  agentStats.activeBounties -= 1;
  agentStats.completedBounties += 1;
  agentStats.save();

  // Update claimer stats
  if (bounty.claimer) {
    let claimerStats = getOrCreateClaimerStats(bounty.claimer as Bytes);
    claimerStats.activeClaims -= 1;
    claimerStats.completedBounties += 1;
    claimerStats.totalEarned = claimerStats.totalEarned.plus(event.params.param2);
    claimerStats.save();
  }
}

export function handleBountyCancelled(event: BountyCancelled): void {
  let bountyId = event.params.param0.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'cancelled';
  bounty.save();

  let agentStats = getOrCreateAgentStats(bounty.agent);
  agentStats.activeBounties -= 1;
  agentStats.cancelledBounties += 1;
  agentStats.save();

  // If there was a claimer, update their stats
  if (bounty.claimer) {
    let claimerStats = getOrCreateClaimerStats(bounty.claimer as Bytes);
    claimerStats.activeClaims -= 1;
    claimerStats.save();
  }
}
