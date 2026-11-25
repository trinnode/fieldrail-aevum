"use client";

import { useState } from "react";
import { formatAmount } from "@fieldrail/contracts-client";
import { DEMO_AGENT_ADDRESS, isConfigured, DEMO_VAULT_ADDRESS } from "@fieldrail/chain-config";
import { shortHex } from "@fieldrail/shared-types";
import { DataModeBanner } from "@/components/demo-banner";
import { Meter, Notice, Panel, Stat } from "@/components/ui";
import { useProgramme } from "@/lib/use-programme";
import { useProgrammeActions } from "@/lib/use-programme-actions";
import { categoryLabel, teamLabel } from "@/lib/constants";

export default function AgentsPage() {
  const { snapshot, refresh } = useProgramme();
  const actions = useProgrammeActions();
  const [notice, setNotice] = useState<string | null>(null);
  const m = snapshot.mandate;
  const live = isConfigured(DEMO_VAULT_ADDRESS);

  async function revoke() {
    setNotice("Submitting revokeAgent…");
    const result = await actions.revokeAgent(DEMO_AGENT_ADDRESS);
    setNotice(result.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Agent mandate console</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Bounded authority, instantly revocable
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-inksoft">
          The agent may only call <code className="num">payInvoice</code> for one team and one category. It cannot change
          its own scope, register suppliers, pause the programme or reclaim funds.
        </p>
      </div>
      <DataModeBanner />
      {notice && <Notice tone="info">{notice}</Notice>}

      {!m ? (
        <Notice tone="warn">No active mandate found for the configured agent wallet.</Notice>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Agent" value={shortHex(m.agent, 8, 6)} sub="Scoped procurement key" />
            <Stat label="Scope" value={teamLabel(m.teamId)} sub={categoryLabel(m.categoryId)} />
            <Stat label="Per invoice" value={`${formatAmount(m.perInvoiceCap)}`} sub="tUSD8 maximum" />
            <Stat label="Lifetime left" value={`${formatAmount(m.cumulativeCap - m.spent)}`} sub={`of ${formatAmount(m.cumulativeCap)} tUSD8`} tone="accent" />
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Panel kicker="Mandate" title="Authorization detail">
              <dl className="divide-y divide-line text-sm">
                {[
                  ["Status", m.active ? "Active" : "Revoked"],
                  ["Field team", teamLabel(m.teamId)],
                  ["Expense category", categoryLabel(m.categoryId)],
                  ["Spent to date", `${formatAmount(m.spent)} tUSD8`],
                  ["Cumulative cap", `${formatAmount(m.cumulativeCap)} tUSD8`],
                  ["Expiry", m.expiresAt > 0n ? new Date(Number(m.expiresAt) * 1000).toISOString() : "Demo value"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-inksoft">{k}</dt>
                    <dd className="num text-right text-xs">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5">
                <Meter spent={m.spent} cap={m.cumulativeCap} label="Lifetime allowance used" />
              </div>
            </Panel>

            <Panel kicker="Safety" title="What the agent cannot do">
              <ul className="space-y-2.5 text-sm text-inksoft">
                {[
                  "Transfer an arbitrary amount to an arbitrary address",
                  "Add, remove or re-approve a supplier",
                  "Raise its own caps or extend its expiry",
                  "Pause, resume or close the programme",
                  "Reclaim unspent funds to any wallet",
                  "Sign on behalf of the sponsor or supplier",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-danger">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="btn-quiet mt-6 w-full text-sm border-danger/40 text-danger disabled:opacity-40"
                disabled={!live || actions.busy || !m.active}
                onClick={() => void revoke()}
              >
                Revoke agent mandate
              </button>
              <p className="mt-2 text-xs text-muted">Live mode only. Revocation is immediate and cannot be undone by the agent.</p>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
