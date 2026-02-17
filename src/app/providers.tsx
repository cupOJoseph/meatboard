'use client';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'Meat Market',
  projectId: 'meat-market', // WalletConnect project ID (optional for injected wallets)
  chains: [arbitrum],
  transports: {
    [arbitrum.id]: http('https://arb-mainnet.g.alchemy.com/v2/WtGzKM0NAY_Mr3rAYlykQWnzPF6JbcHy'),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
