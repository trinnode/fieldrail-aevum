"use client";

import { useEffect, useState } from "react";
import { isConfigured, DEMO_VAULT_ADDRESS, DEMO_SUPPLIER_ADDRESS, DEMO_AGENT_ADDRESS } from "@fieldrail/chain-config";
import { vaultAbi } from "@fieldrail/contracts-client";
import { CATEGORIES, TEAMS, PROGRAMME_TITLE } from "./constants";
import { useChain } from "./chain-provider";

export type BudgetLine = {
  id: `0x${string}`;
  label: string;
  cap: bigint;
  spent: bigint;
  remaining: bigint;
};

export type TeamLine = {
  id: `0x${string}`;
  label: string;
  allocations: BudgetLine[];
};

export type SupplierLine = {
  address: `0x${string}`;
  categoryId: `0x${string}`;
  label: string;
  active: boolean;
};

export type MandateLine = {
  agent: `0x${string}`;
  teamId: `0x${string}`;
  categoryId: `0x${string}`;
  perInvoiceCap: bigint;
  cumulativeCap: bigint;
  spent: bigint;
  expiresAt: bigint;
  active: boolean;
};

export type ProgrammeSnapshot = {
  source: "onchain" | "demo";
  vault: `0x${string}` | null;
  title: string;
  status: "Active" | "Paused" | "Closed";
  funded: bigint;
  spent: bigint;
  remaining: bigint;
  startAt: bigint;
  expiresAt: bigint;
  sponsor: `0x${string}` | null;
  categories: BudgetLine[];
  teams: TeamLine[];
  suppliers: SupplierLine[];
  mandate: MandateLine | null;
};

const DEMO: ProgrammeSnapshot = {
  source: "demo",
  vault: null,
  title: PROGRAMME_TITLE,
  status: "Active",
  funded: 1_000_000_000n,
  spent: 18_000_000n,
  remaining: 982_000_000n,
  startAt: 0n,
  expiresAt: 0n,
  sponsor: null,
  categories: CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    cap: c.cap,
    spent: c.id === CATEGORIES[0].id ? 18_000_000n : 0n,
    remaining: c.cap - (c.id === CATEGORIES[0].id ? 18_000_000n : 0n),
  })),
  teams: TEAMS.map((t) => ({
    id: t.id,
    label: t.label,
    allocations: t.allocations.map((a) => {
      const spent = t.id === TEAMS[0].id && a.categoryId === CATEGORIES[0].id ? 18_000_000n : 0n;
      return {
        id: a.categoryId,
        label: CATEGORIES.find((c) => c.id === a.categoryId)?.label ?? "Unknown",
        cap: a.cap,
        spent,
        remaining: a.cap - spent,
      };
    }),
  })),
  suppliers: [
    { address: DEMO_SUPPLIER_ADDRESS, categoryId: CATEGORIES[0].id, label: "Apex Water Works (synthetic)", active: true },
    { address: DEMO_SUPPLIER_ADDRESS, categoryId: CATEGORIES[1].id, label: "Apex Water Works (synthetic)", active: false },
  ],
  mandate: {
    agent: DEMO_AGENT_ADDRESS,
    teamId: TEAMS[0].id,
    categoryId: CATEGORIES[0].id,
    perInvoiceCap: 100_000_000n,
    cumulativeCap: 300_000_000n,
    spent: 18_000_000n,
    expiresAt: 0n,
    active: true,
  },
};

function statusName(code: number): ProgrammeSnapshot["status"] {
  return code === 1 ? "Paused" : code === 2 ? "Closed" : "Active";
}

export function useProgramme() {
  const { publicClient } = useChain();
  const live = isConfigured(DEMO_VAULT_ADDRESS);
  const [snapshot, setSnapshot] = useState<ProgrammeSnapshot>(DEMO);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!live) {
      setSnapshot(DEMO);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const vault = DEMO_VAULT_ADDRESS;

    async function load() {
      try {
        const [
          statusCode, funded, spent, refunded, startAt, expiresAt, sponsor, remaining,
        ] = await Promise.all([
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "status" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "totalFunded" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "totalSpent" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "refunded" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "startAt" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "expiresAt" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "sponsor" }),
          publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "getFundsRemaining" }),
        ]);

        const categories = await Promise.all(
          CATEGORIES.map(async (c) => {
            const [cap, categorySpent] = await Promise.all([
              publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "categoryCap", args: [c.id] }),
              publicClient.readContract({ address: vault, abi: vaultAbi, functionName: "categorySpent", args: [c.id] }),
            ]);
            return { id: c.id, label: c.label, cap, spent: categorySpent, remaining: cap - categorySpent };
          }),
        );

        const teams = await Promise.all(
          TEAMS.map(async (t) => {
            const allocations = await Promise.all(
              t.allocations.map(async (a) => {
                const [cap, allocationSpent] = await Promise.all([
                  publicClient.readContract({
                    address: vault, abi: vaultAbi, functionName: "teamCategoryCap", args: [t.id, a.categoryId],
                  }),
                  publicClient.readContract({
                    address: vault, abi: vaultAbi, functionName: "teamCategorySpent", args: [t.id, a.categoryId],
                  }),
                ]);
                return {
                  id: a.categoryId,
                  label: CATEGORIES.find((c) => c.id === a.categoryId)?.label ?? "Unknown",
                  cap,
                  spent: allocationSpent,
                  remaining: cap > allocationSpent ? cap - allocationSpent : 0n,
                };
              }),
            );
            return { id: t.id, label: t.label, allocations };
          }),
        );

        const suppliers = (
          await Promise.all(
            CATEGORIES.map(async (c) => {
              const info = await publicClient.readContract({
                address: vault, abi: vaultAbi, functionName: "suppliers", args: [DEMO_SUPPLIER_ADDRESS, c.id],
              });
              return {
                address: DEMO_SUPPLIER_ADDRESS,
                categoryId: c.id,
                label: c.short,
                active: Boolean(info[0]),
              };
            }),
          )
        ).filter((s) => s.active);

        const m = await publicClient.readContract({
          address: vault, abi: vaultAbi, functionName: "mandates", args: [DEMO_AGENT_ADDRESS],
        });

        if (cancelled) return;
        setSnapshot({
          source: "onchain",
          vault,
          title: PROGRAMME_TITLE,
          status: statusName(Number(statusCode)),
          funded,
          spent,
          remaining,
          startAt,
          expiresAt,
          sponsor: sponsor as `0x${string}`,
          categories,
          teams,
          suppliers,
          mandate: m[0]
            ? {
                agent: DEMO_AGENT_ADDRESS,
                teamId: m[1],
                categoryId: m[2],
                perInvoiceCap: m[3],
                cumulativeCap: m[4],
                spent: m[5],
                expiresAt: m[6],
                active: Boolean(m[0]),
              }
            : null,
        });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not read programme state from the RPC.");
          setSnapshot(DEMO);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [live, publicClient, refreshKey]);

  return { snapshot, loading, error, refresh, live };
}
