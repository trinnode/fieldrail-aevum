/**
 * Aevum network and token configuration.
 *
 * Values marked DEFAULT are taken from the build brief and MUST be re-verified
 * against the live RPC before use (see research/QDAY_PLATFORM.md). Runtime
 * environment variables always win.
 */

export type NetworkConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: { name: string; symbol: string; decimals: number };
  testnet: boolean;
};

const DEFAULT_AEVUM: NetworkConfig = {
  id: 44005,
  name: "QDay Aevum Testnet",
  rpcUrl: "https://rpc-test.qday.info",
  explorerUrl: "https://explorer-test.qday.info",
  currency: { name: "tQDAY", symbol: "tQDAY", decimals: 18 },
  testnet: true,
};

export const aevumChain: NetworkConfig = {
  id: Number(process.env.NEXT_PUBLIC_QDAY_CHAIN_ID ?? DEFAULT_AEVUM.id),
  name: DEFAULT_AEVUM.name,
  rpcUrl: process.env.NEXT_PUBLIC_QDAY_RPC_URL ?? DEFAULT_AEVUM.rpcUrl,
  explorerUrl: process.env.NEXT_PUBLIC_QDAY_EXPLORER_URL ?? DEFAULT_AEVUM.explorerUrl,
  currency: DEFAULT_AEVUM.currency,
  testnet: true,
};

/** Token address from the brief, verified via eth_getCode + decimals() at runtime. */
export const TUSD8_ADDRESS = (process.env.NEXT_PUBLIC_TUSD8_ADDRESS ??
  "0x456569838f1d43009A91ebA4263147Afd7233483") as `0x${string}`;

export const TUSD8_DECIMALS = 6;

export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`;

export const DEMO_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_PROGRAM_VAULT_ADDRESS ?? "") as `0x${string}`;

export const PROGRAMME_ID = "NORTHERN_WATER_ACCESS_DEMO";

export function txUrl(hash: string): string {
  return `${aevumChain.explorerUrl}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${aevumChain.explorerUrl}/address/${address}`;
}

export function isConfigured(address: `0x${string}` | string): boolean {
  return Boolean(address) && address !== "0x0000000000000000000000000000000000000000";
}
