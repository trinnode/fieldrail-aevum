"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { aevumChain } from "@fieldrail/chain-config";

type EIP1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EIP1193;
  }
}

export const fieldrailChain = defineChain({
  id: aevumChain.id,
  name: aevumChain.name,
  nativeCurrency: {
    name: aevumChain.currency.name,
    symbol: aevumChain.currency.symbol,
    decimals: aevumChain.currency.decimals,
  },
  rpcUrls: { default: { http: [aevumChain.rpcUrl] } },
  blockExplorers: {
    default: { name: "Aevum Explorer", url: aevumChain.explorerUrl },
  },
  testnet: true,
});

type ChainContextValue = {
  account: `0x${string}` | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  hasProvider: boolean;
  publicClient: PublicClient;
  walletClient: WalletClient | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  ensureChain: () => Promise<boolean>;
};

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);

  const publicClient = useMemo(
    () => createPublicClient({ chain: fieldrailChain, transport: http(aevumChain.rpcUrl) }),
    [],
  );

  const walletClient = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return createWalletClient({ chain: fieldrailChain, transport: custom(window.ethereum as never) });
  }, [hasProvider]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    setHasProvider(true);
    const provider = window.ethereum;
    provider
      .request({ method: "eth_accounts" })
      .then((result) => {
        const accounts = result as `0x${string}`[];
        if (accounts?.length) setAccount(accounts[0]);
      })
      .catch(() => undefined);
    provider
      .request({ method: "eth_chainId" })
      .then((result) => setChainId(Number(result as string)))
      .catch(() => undefined);

    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as `0x${string}`[];
      setAccount(accounts?.length ? accounts[0] : null);
    };
    const onChain = (...args: unknown[]) => setChainId(Number(args[0] as string));
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const ensureChain = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No injected wallet found. Install a browser wallet to sign transactions.");
      return false;
    }
    try {
      const current = await window.ethereum.request({ method: "eth_chainId" });
      if (Number(current) === aevumChain.id) {
        setChainId(aevumChain.id);
        return true;
      }
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${aevumChain.id.toString(16)}` }],
        });
      } catch (switchError) {
        const code = (switchError as { code?: number })?.code;
        if (code !== 4902) throw switchError;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${aevumChain.id.toString(16)}`,
              chainName: aevumChain.name,
              rpcUrls: [aevumChain.rpcUrl],
              blockExplorerUrls: [aevumChain.explorerUrl],
              nativeCurrency: {
                name: aevumChain.currency.name,
                symbol: aevumChain.currency.symbol,
                decimals: aevumChain.currency.decimals,
              },
            },
          ],
        });
      }
      setChainId(aevumChain.id);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch to Aevum.");
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!(await ensureChain())) return;
      if (!window.ethereum) return;
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as `0x${string}`[];
      if (accounts?.length) setAccount(accounts[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed.");
    } finally {
      setConnecting(false);
    }
  }, [ensureChain]);

  const disconnect = useCallback(() => setAccount(null), []);

  const value = useMemo<ChainContextValue>(
    () => ({
      account,
      chainId,
      connecting,
      error,
      hasProvider,
      publicClient,
      walletClient,
      connect,
      disconnect,
      ensureChain,
    }),
    [account, chainId, connecting, error, hasProvider, publicClient, walletClient, connect, disconnect, ensureChain],
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain(): ChainContextValue {
  const value = useContext(ChainContext);
  if (!value) throw new Error("useChain must be used inside ChainProvider");
  return value;
}
