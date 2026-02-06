export type BountyStatus = 
  | 'open'
  | 'claimed'
  | 'submitted'
  | 'verified'
  | 'paid'
  | 'expired'
  | 'cancelled';

export type ProofType = 'photo' | 'receipt' | 'signature' | 'custom';

export interface Location {
  lat: number;
  lng: number;
  radius_m?: number;
}

export interface Bounty {
  id: string;
  title: string;
  description?: string;
  reward: number; // USDC amount
  deadline: string; // ISO timestamp or duration like "2h"
  proof_type: ProofType;
  location?: Location;
  status: BountyStatus;
  
  // Agent info
  agent_id: string;
  agent_wallet: string;
  
  // Human info (when claimed)
  claimer_id?: string;
  claimer_wallet?: string;
  claimed_at?: string;
  
  // Proof info (when submitted)
  proof_url?: string;
  proof_location?: Location;
  submitted_at?: string;
  
  // Transaction info
  escrow_tx?: string;
  payout_tx?: string;
  
  // Timestamps
  created_at: string;
  expires_at: string;
  verified_at?: string;
  paid_at?: string;
}

export interface CreateBountyRequest {
  title: string;
  description?: string;
  reward: number;
  deadline: string;
  proof_type?: ProofType;
  location?: Location;
  webhook_url?: string;
}

export interface VerifyBountyRequest {
  approved: boolean;
  note?: string;
}

export interface ApiError {
  error: string;
  code: string;
}
