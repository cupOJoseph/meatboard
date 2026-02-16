import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  BountyCreated,
  BountyClaimed,
  BountySubmitted,
  BountyPaid,
  BountyCancelled,
  BountyRejected,
  BountyDisputed,
  DisputeResolved,
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
  let bountyId = event.params.id.toString();
  let bounty = new Bounty(bountyId);

  bounty.onchainId = event.params.id;
  bounty.agent = event.params.agent;
  bounty.reward = event.params.amount;
  bounty.metadataURI = event.params.metadataURI;
  bounty.expiresAt = event.params.deadline;
  bounty.status = 'open';
  bounty.title = ''; // Will be populated from metadata
  bounty.deadline = '';
  bounty.proofType = 'photo';
  bounty.token = event.params.token;
  bounty.createdAt = event.block.timestamp;
  bounty.escrowTx = event.transaction.hash;
  bounty.save();

  let agentStats = getOrCreateAgentStats(event.params.agent);
  agentStats.totalBounties += 1;
  agentStats.activeBounties += 1;
  agentStats.totalSpent = agentStats.totalSpent.plus(event.params.amount);
  agentStats.save();
}

export function handleBountyClaimed(event: BountyClaimed): void {
  let bountyId = event.params.id.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'claimed';
  bounty.claimer = event.params.claimer;
  bounty.claimedAt = event.block.timestamp;
  bounty.save();

  let claimerStats = getOrCreateClaimerStats(event.params.claimer);
  claimerStats.totalClaimed += 1;
  claimerStats.activeClaims += 1;
  claimerStats.save();
}

export function handleBountySubmitted(event: BountySubmitted): void {
  let bountyId = event.params.id.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'submitted';
  bounty.proofUrl = event.params.proofURI;
  bounty.submittedAt = event.block.timestamp;
  bounty.save();
}

export function handleBountyPaid(event: BountyPaid): void {
  let bountyId = event.params.id.toString();
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
    claimerStats.totalEarned = claimerStats.totalEarned.plus(event.params.payout);
    claimerStats.save();
  }
}

export function handleBountyCancelled(event: BountyCancelled): void {
  let bountyId = event.params.id.toString();
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

export function handleBountyRejected(event: BountyRejected): void {
  let bountyId = event.params.id.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'rejected';
  bounty.rejectedAt = event.block.timestamp;
  bounty.rejectedReason = event.params.reason;
  bounty.save();
}

export function handleBountyDisputed(event: BountyDisputed): void {
  let bountyId = event.params.id.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.status = 'disputed';
  bounty.disputeInitiator = event.params.claimer;
  bounty.disputeBond = event.params.bond;
  bounty.disputeEvidenceURI = event.params.evidenceURI;
  bounty.disputeFiledAt = event.block.timestamp;
  bounty.disputeResolved = false;
  bounty.save();
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let bountyId = event.params.id.toString();
  let bounty = Bounty.load(bountyId);
  if (!bounty) return;

  bounty.disputeResolved = true;
  bounty.disputeClaimerWon = event.params.claimerWins;

  if (event.params.claimerWins) {
    // claimerWins — bounty will be paid out, BountyPaid event handles status
    bounty.status = 'disputed';
  } else {
    // agent wins — bounty cancelled, BountyCancelled event handles stats
    bounty.status = 'cancelled';
  }
  bounty.save();
}
