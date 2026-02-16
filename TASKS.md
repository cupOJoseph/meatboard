# Meatboard — Task List

## Phase 1: Smart Contract
- [ ] **T1: Write MeatboardEscrow.sol** — Foundry project in contracts/, full contract per SPEC.md
- [ ] **T2: Write Foundry tests** — create, claim, submit, release, cancel, expire, fee logic
- [ ] **T3: Deploy to Arbitrum Sepolia** — test deployment + verify on Arbiscan

## Phase 2: Subgraph
- [ ] **T4: Create subgraph** — schema + mappings for all events
- [ ] **T5: Deploy subgraph** — Subgraph Studio for Arbitrum Sepolia
- [ ] **T6: Test queries** — verify all GraphQL queries from SPEC.md work

## Phase 3: Frontend Rewrite
- [ ] **T7: Remove placeholder data + Prisma** — gut all mock arrays and DB code
- [ ] **T8: Add GraphQL client** — urql or graphql-request for subgraph queries
- [ ] **T9: Wire pages to subgraph** — home, human, bounty detail, dashboard all query Graph
- [ ] **T10: IPFS metadata** — upload bounty metadata to IPFS on create, fetch + display on detail
- [ ] **T11: Contract write integration** — createBounty, claimBounty, submitProof, releaseBounty via wagmi
- [ ] **T12: Three-button flow** — Switch Network → Approve Token → Action (per ethskills)
- [ ] **T13: Transaction UX** — spinners, disable, confirmation wait on all onchain buttons

## Phase 4: Polish + Deploy
- [ ] **T14: Token selector** — pick USDC/USDT/DAI/WETH/custom address
- [ ] **T15: Proof upload** — image to IPFS, reference in submitProof
- [ ] **T16: Deploy contract to Arbitrum mainnet**
- [ ] **T17: Deploy subgraph to Arbitrum mainnet**
- [ ] **T18: Update skill.md with real contract addresses**

## Current Sprint: T1 → T3 (contract + tests + testnet deploy)
