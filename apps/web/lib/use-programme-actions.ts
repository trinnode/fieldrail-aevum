"use client";

import { useState } from "react";
import type { Abi } from "viem";
import { DEMO_VAULT_ADDRESS, FACTORY_ADDRESS, TUSD8_ADDRESS } from "@fieldrail/chain-config";
import { factoryAbi, vaultAbi } from "@fieldrail/contracts-client";
import { explainError } from "@fieldrail/contracts-client";
import { useChain } from "./chain-provider";

export type ActionResult = { hash?: `0x${string}`; ok: boolean; message: string };

export function useProgrammeActions() {
  const { walletClient, publicClient, account, ensureChain } = useChain();
  const [busy, setBusy] = useState(false);
  const [lastHash, setLastHash] = useState<`0x${string}` | null>(null);

  async function write(
    address: `0x${string}`,
    abi: Abi,
    functionName: string,
    args: readonly unknown[] = [],
  ): Promise<ActionResult> {
    if (!walletClient || !account) return { ok: false, message: "Connect a wallet first." };
    if (!(await ensureChain())) return { ok: false, message: "Wallet is not on Aevum." };
    setBusy(true);
    try {
      const hash = await walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
        account,
      } as never);
      setLastHash(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") return { ok: false, hash, message: "Transaction reverted on-chain." };
      return { ok: true, hash, message: `Confirmed in block ${receipt.blockNumber}.` };
    } catch (e) {
      const explanation = explainError(e);
      return { ok: false, message: explanation.message };
    } finally {
      setBusy(false);
    }
  }

  const vault = async (fn: string, args: readonly unknown[] = []) =>
    write(DEMO_VAULT_ADDRESS, vaultAbi as Abi, fn, args);

  return {
    busy,
    lastHash,
    pause: () => vault("pauseProgramme"),
    resume: () => vault("resumeProgramme"),
    close: () => vault("closeProgramme"),
    refund: () => vault("refundUnspent"),
    revokeAgent: (agent: `0x${string}`) => vault("revokeAgent", [agent]),
    revokeSupplier: (supplier: `0x${string}`, categoryId: `0x${string}`) =>
      vault("revokeSupplier", [supplier, categoryId]),
    registerSupplier: (supplier: `0x${string}`, categoryId: `0x${string}`, metadataHash: `0x${string}`) =>
      vault("registerSupplier", [supplier, categoryId, metadataHash]),
    authoriseAgent: (
      agent: `0x${string}`,
      teamId: `0x${string}`,
      categoryId: `0x${string}`,
      perInvoiceCap: bigint,
      cumulativeCap: bigint,
      expiresAt: bigint,
    ) => vault("authoriseAgent", [agent, teamId, categoryId, perInvoiceCap, cumulativeCap, expiresAt]),
    configureCategory: (categoryId: `0x${string}`, cap: bigint) => vault("configureCategory", [categoryId, cap]),
    allocateTeam: (teamId: `0x${string}`, categoryId: `0x${string}`, cap: bigint) =>
      vault("allocateTeam", [teamId, categoryId, cap]),
    fund: (amount: bigint) => vault("fund", [amount]),
    approveToken: (amount: bigint) =>
      write(TUSD8_ADDRESS, [
        { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
      ] as Abi, "approve", [DEMO_VAULT_ADDRESS, amount]),
    createProgramme: (programmeId: `0x${string}`, token: `0x${string}`, metadataHash: `0x${string}`, startAt: bigint, expiresAt: bigint) =>
      write(FACTORY_ADDRESS, factoryAbi as Abi, "createProgramme", [programmeId, token, metadataHash, startAt, expiresAt]),
  };
}
