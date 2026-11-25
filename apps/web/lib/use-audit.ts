"use client";

import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { DEMO_VAULT_ADDRESS, isConfigured } from "@fieldrail/chain-config";
import { useChain } from "./chain-provider";

export type AuditEntry = {
  invoiceId: `0x${string}`;
  teamId: `0x${string}`;
  categoryId: `0x${string}`;
  supplier: `0x${string}`;
  agent: `0x${string}`;
  amount: bigint;
  evidenceHash: `0x${string}`;
  nonce: bigint;
  transactionHash: `0x${string}` | null;
  blockNumber: bigint | null;
  source: "onchain" | "demo";
};

const INVOICE_PAID = parseAbiItem(
  "event InvoicePaid(bytes32 indexed invoiceId, bytes32 indexed programmeId, bytes32 indexed teamId, bytes32 categoryId, address supplier, address agent, uint256 amount, bytes32 evidenceHash, uint256 nonce)",
);

const DEMO_ENTRY: AuditEntry = {
  invoiceId: ("0x" + "01".repeat(32)) as `0x${string}`,
  teamId: ("0x" + "02".repeat(32)) as `0x${string}`,
  categoryId: ("0x" + "03".repeat(32)) as `0x${string}`,
  supplier: "0x1111111111111111111111111111111111111111",
  agent: "0x2222222222222222222222222222222222222222",
  amount: 18_000_000n,
  evidenceHash: ("0x" + "04".repeat(32)) as `0x${string}`,
  nonce: 1n,
  transactionHash: null,
  blockNumber: null,
  source: "demo",
};

export function useAudit() {
  const { publicClient } = useChain();
  const live = isConfigured(DEMO_VAULT_ADDRESS);
  const [entries, setEntries] = useState<AuditEntry[]>(live ? [] : [DEMO_ENTRY]);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!live) {
      setEntries([DEMO_ENTRY]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const latest = await publicClient.getBlockNumber();
        // Aevum's log endpoint is limited to ~1,000 blocks per request.
        const found: AuditEntry[] = [];
        const chunk = 900n;
        let to = latest;
        const floor = latest > 9000n ? latest - 9000n : 0n;
        while (to >= floor && !cancelled) {
          const from = to > floor + chunk - 1n ? to - chunk + 1n : floor;
          const logs = await publicClient.getLogs({
            address: DEMO_VAULT_ADDRESS,
            event: INVOICE_PAID,
            fromBlock: from,
            toBlock: to,
          });
          for (const log of logs) {
            found.push({
              invoiceId: log.args.invoiceId!,
              teamId: log.args.teamId!,
              categoryId: log.args.categoryId!,
              supplier: log.args.supplier!,
              agent: log.args.agent!,
              amount: log.args.amount!,
              evidenceHash: log.args.evidenceHash!,
              nonce: log.args.nonce!,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              source: "onchain",
            });
          }
          if (to === 0n) break;
          to = from - 1n;
        }
        if (!cancelled) {
          setEntries(found.reverse());
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Log query failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [live, publicClient]);

  return { entries, loading, error, live };
}
