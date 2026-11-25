"use client";

import { useState } from "react";
import { parseEventLogs } from "viem";
import { bytes32 } from "@fieldrail/shared-types";
import { factoryAbi, formatAmount, parseAmount } from "@fieldrail/contracts-client";
import {
  TUSD8_ADDRESS,
  DEMO_SUPPLIER_ADDRESS,
  DEMO_AGENT_ADDRESS,
  FACTORY_ADDRESS,
  isConfigured,
  addressUrl,
} from "@fieldrail/chain-config";
import { DataModeBanner } from "@/components/demo-banner";
import { Notice, Panel, Stat } from "@/components/ui";
import { CATEGORIES, TEAMS, PROGRAMME_ID } from "@/lib/constants";
import { useChain } from "@/lib/chain-provider";
import { useProgrammeActions } from "@/lib/use-programme-actions";
import { shortHex } from "@fieldrail/shared-types";

export default function CreatePage() {
  const { account } = useChain();
  const { publicClient } = useChain();
  const actions = useProgrammeActions();
  const [durationDays, setDurationDays] = useState("30");
  const [funding, setFunding] = useState("1000");
  const [metadata, setMetadata] = useState("ipfs://fieldrail-demo-metadata");
  const [log, setLog] = useState<string[]>([]);
  const [vault, setVault] = useState<`0x${string}` | null>(null);
  const [busy, setBusy] = useState(false);
  const live = isConfigured(FACTORY_ADDRESS);

  const push = (line: string) => setLog((prev) => [...prev, line]);

  async function execute() {
    setBusy(true);
    setLog([]);
    try {
      const expiresAt = BigInt(Math.floor(Date.now() / 1000)) + BigInt(Number(durationDays)) * 86_400n;
      push("Creating programme with the factory…");
      const created = await actions.createProgramme(PROGRAMME_ID, TUSD8_ADDRESS, bytes32(metadata), 0n, expiresAt);
      if (!created.ok || !created.hash) throw new Error(created.message);
      push(`Create tx: ${shortHex(created.hash, 10, 8)}`);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: created.hash });
      const events = parseEventLogs({ abi: factoryAbi, eventName: "ProgramCreated", logs: receipt.logs });
      const address = events[0]?.args.vault;
      if (!address) throw new Error("ProgramCreated event did not contain a vault address.");
      setVault(address);
      push(`Vault deployed: ${shortHex(address, 10, 8)}`);

      const amount = parseAmount(funding);
      push(`Approving ${formatAmount(amount)} tUSD8…`);
      const approved = await actions.approveToken(amount);
      if (!approved.ok) throw new Error(approved.message);

      push("Funding programme…");
      const funded = await actions.fund(amount);
      if (!funded.ok) throw new Error(funded.message);

      // The setup actions below target NEXT_PUBLIC_PROGRAM_VAULT_ADDRESS.
      // Set it to the newly deployed vault before running this wizard's
      // configuration phase; the UI never guesses an address silently.
      push("Vault deployed and funded. Set NEXT_PUBLIC_PROGRAM_VAULT_ADDRESS to the address above, then configure envelopes from the Programme page.");
    } catch (e) {
      push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Programme creation</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Create a purpose-bound programme
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-inksoft">
          Deploy a fresh vault, deposit tUSD8, then configure category envelopes, team allocations, approved suppliers and
          a scoped agent mandate. Every step is a separate sponsor transaction.
        </p>
      </div>
      <DataModeBanner />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Panel kicker="Step 1" title="Programme parameters">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label mb-1.5 block">Programme ID</span>
              <input className="input num text-xs" value={PROGRAMME_ID} readOnly />
            </label>
            <label className="block">
              <span className="label mb-1.5 block">Duration (days)</span>
              <input className="input num" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} inputMode="numeric" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label mb-1.5 block">Metadata reference</span>
              <input className="input" value={metadata} onChange={(e) => setMetadata(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="label mb-1.5 block">Initial funding (tUSD8)</span>
              <input className="input num" value={funding} onChange={(e) => setFunding(e.target.value)} inputMode="decimal" />
            </label>
          </div>
          <button className="btn-primary mt-5 text-sm moving-border" disabled={busy || !live || !account} onClick={() => void execute()}>
            {busy ? "Executing…" : "Deploy and fund on Aevum"}
          </button>
          {!live && <p className="mt-3 text-xs text-copper">Factory address is not configured; deployment is disabled.</p>}
        </Panel>

        <Panel kicker="Step 2" title="Policy template">
          <div className="space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex justify-between rounded-lg border border-line px-3 py-2">
                <span>{c.label}</span>
                <span className="num">{formatAmount(c.cap)} tUSD8</span>
              </div>
            ))}
            <div className="flex justify-between rounded-lg border border-dashed border-copper/50 px-3 py-2 text-copper">
              <span>Unallocated reserve</span>
              <span className="num">100.00 tUSD8</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-inksoft">
            Teams: {TEAMS.map((t) => t.label).join(", ")}. Supplier: <span className="num">{shortHex(DEMO_SUPPLIER_ADDRESS)}</span>.
            Agent: <span className="num">{shortHex(DEMO_AGENT_ADDRESS)}</span>.
          </div>
          {vault && (
            <div className="mt-4">
              <Stat label="Deployed vault" value={shortHex(vault, 10, 8)} sub={addressUrl(vault)} />
            </div>
          )}
        </Panel>
      </div>

      {log.length > 0 && (
        <Panel kicker="Execution log" title="Transaction steps">
          <ol className="space-y-2 text-sm">
            {log.map((line, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-line bg-[#fbfaf7] px-3 py-2">
                <span className="num text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
