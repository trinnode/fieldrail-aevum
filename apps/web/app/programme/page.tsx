"use client";

import { useState } from "react";
import { formatAmount } from "@fieldrail/contracts-client";
import { addressUrl, DEMO_VAULT_ADDRESS, isConfigured } from "@fieldrail/chain-config";
import { DataModeBanner } from "@/components/demo-banner";
import { Meter, Notice, Panel, Stat, StatusChip } from "@/components/ui";
import { useProgramme } from "@/lib/use-programme";
import { useProgrammeActions } from "@/lib/use-programme-actions";
import { shortHex } from "@fieldrail/shared-types";

export default function ProgrammePage() {
  const { snapshot, loading, error, refresh } = useProgramme();
  const actions = useProgrammeActions();
  const [notice, setNotice] = useState<string | null>(null);
  const live = isConfigured(DEMO_VAULT_ADDRESS);

  async function run(label: string, action: () => Promise<{ ok: boolean; message: string }>) {
    setNotice(`${label}: submitting…`);
    const result = await action();
    setNotice(`${label}: ${result.message}`);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label mb-2">Programme overview</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {snapshot.title}
          </h1>
          <p className="mt-2 text-sm text-inksoft">
            Vault {live && snapshot.vault ? <a className="num underline underline-offset-4" href={addressUrl(snapshot.vault)} target="_blank" rel="noreferrer">{shortHex(snapshot.vault)} ↗</a> : "not configured"}
          </p>
        </div>
        <StatusChip status={snapshot.status} />
      </div>

      <DataModeBanner />
      {error && <Notice tone="danger">RPC read error: {error}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total funded" value={`${formatAmount(snapshot.funded)}`} sub="tUSD8 base-unit accounting" />
        <Stat label="Total spent" value={`${formatAmount(snapshot.spent)}`} sub="Signed invoices only" tone="copper" />
        <Stat label="Available" value={`${formatAmount(snapshot.remaining)}`} sub="Refundable on closure" tone="accent" />
        <Stat
          label="Expiry"
          value={snapshot.expiresAt > 0n ? new Date(Number(snapshot.expiresAt) * 1000).toISOString().slice(0, 10) : "Demo"}
          sub={loading ? "reading chain…" : snapshot.source === "onchain" ? "on-chain value" : "synthetic"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel kicker="Envelope hierarchy" title="Expense category budgets">
          <div className="space-y-5">
            {snapshot.categories.map((c) => (
              <div key={c.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="num text-xs text-inksoft">
                    {formatAmount(c.remaining)} / {formatAmount(c.cap)}
                  </span>
                </div>
                <Meter spent={c.spent} cap={c.cap} />
              </div>
            ))}
            <div className="border-t border-line pt-4 text-xs text-muted">
              100.00 tUSD8 is held as an unallocated reserve. It cannot be spent by any agent mandate.
            </div>
          </div>
        </Panel>

        <Panel kicker="Nested allocation" title="Field team envelopes">
          <div className="space-y-5">
            {snapshot.teams.map((t) => (
              <div key={t.id} className="rounded-xl border border-line bg-[#fbfaf7] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="label">team</span>
                </div>
                <div className="space-y-3">
                  {t.allocations.map((a) => (
                    <div key={a.id}>
                      <div className="mb-1 flex justify-between text-xs text-inksoft">
                        <span>{a.label}</span>
                        <span className="num">{formatAmount(a.remaining)} left</span>
                      </div>
                      <Meter spent={a.spent} cap={a.cap} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel kicker="Payee registry" title="Approved suppliers">
          <div className="space-y-2">
            {snapshot.suppliers.length === 0 && <p className="text-sm text-muted">No active supplier records read.</p>}
            {snapshot.suppliers.map((s, i) => (
              <div key={`${s.address}-${s.categoryId}-${i}`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="num text-[11px] text-muted">{shortHex(s.address)}</div>
                </div>
                <span className="chip text-positive">Approved</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel kicker="Sponsor controls" title="Lifecycle">
          <Notice tone="info">
            These buttons submit real transactions when live mode is configured. In demo mode they are disabled so no
            simulated state can be mistaken for an on-chain action.
          </Notice>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Pause", () => run("Pause", actions.pause)],
              ["Resume", () => run("Resume", actions.resume)],
              ["Close", () => run("Close", actions.close)],
              ["Refund unspent", () => run("Refund", actions.refund)],
            ].map(([label, fn]) => (
              <button
                key={label as string}
                className="btn-quiet text-sm disabled:opacity-40"
                disabled={!live || actions.busy}
                onClick={() => void (fn as () => Promise<void>)()}
              >
                {label as string}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Pause blocks payments without moving funds. Only a closed programme can be refunded, and only to the sponsor.
          </p>
        </Panel>
      </div>
    </div>
  );
}
