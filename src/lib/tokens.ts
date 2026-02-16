// Token registry for Arbitrum
export interface TokenInfo {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  name: string;
}

export const TOKENS: Record<string, TokenInfo> = {
  USDC: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
  },
  USDT: {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether USD',
  },
  DAI: {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
  },
  WETH: {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
  },
  ARB: {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    decimals: 18,
    symbol: 'ARB',
    name: 'Arbitrum',
  },
};

/**
 * Resolve a token by symbol (case-insensitive) or address.
 */
export function resolveToken(tokenOrAddress: string): TokenInfo | null {
  // Try symbol lookup
  const upper = tokenOrAddress.toUpperCase();
  if (TOKENS[upper]) return TOKENS[upper];

  // Try address lookup
  const lower = tokenOrAddress.toLowerCase();
  for (const t of Object.values(TOKENS)) {
    if (t.address.toLowerCase() === lower) return t;
  }

  return null;
}

/**
 * Convert a human-readable amount to raw token units.
 * e.g. parseTokenAmount("5.00", 6) => 5000000n
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFrac);
}
