# Ethereum Skills Reference

Fetch these as needed for building meatboard:

- https://ethskills.com/addresses/SKILL.md — Verified contract addresses (USDC, Uniswap, etc.)
- https://ethskills.com/building-blocks/SKILL.md — DeFi composability patterns
- https://ethskills.com/wallets/SKILL.md — Wallet patterns, EIP-7702, Safe multisig
- https://ethskills.com/frontend-ux/SKILL.md — Onchain button UX, three-button flow
- https://ethskills.com/frontend-playbook/SKILL.md — Step-by-step frontend build
- https://ethskills.com/standards/SKILL.md — ERC-20, ERC-721, ERC-8004
- https://ethskills.com/security/SKILL.md — Smart contract security
- https://ethskills.com/l2s/SKILL.md — L2 landscape, Arbitrum specifics
- https://ethskills.com/tools/SKILL.md — Foundry, Scaffold-ETH 2
- https://ethskills.com/gas/SKILL.md — Current gas costs

## Key Addresses (Arbitrum)
- USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- USDT: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`
- DAI: `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1`
- WETH: `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`

## Key Patterns
- "onchain" not "on-chain"
- Every onchain button: disable + spinner + wait for confirmation
- Three-button flow: Switch Network → Approve → Action
- Never commit secrets to git
- Arbitrum L2 tx cost: $0.001-0.01
