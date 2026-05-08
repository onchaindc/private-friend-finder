"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

const SolanaConnectionProvider = ConnectionProvider as unknown as ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;

const SolanaWalletProvider = WalletProvider as unknown as ComponentType<{
  wallets: unknown[];
  autoConnect: boolean;
  children: ReactNode;
}>;

const SolanaWalletModalProvider = WalletModalProvider as unknown as ComponentType<{
  children: ReactNode;
}>;

function getNetwork() {
  const configured = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;

  if (configured === "mainnet-beta") {
    return WalletAdapterNetwork.Mainnet;
  }

  if (configured === "testnet") {
    return WalletAdapterNetwork.Testnet;
  }

  return WalletAdapterNetwork.Devnet;
}

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const network = getNetwork();
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  return (
    <SolanaConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <SolanaWalletModalProvider>{children}</SolanaWalletModalProvider>
      </SolanaWalletProvider>
    </SolanaConnectionProvider>
  );
}
