"use client";

import Link from "next/link";
import { formatAmount } from "@fieldrail/contracts-client";
import { AllocationRail } from "@/components/allocation-rail";
import { DataModeBanner } from "@/components/demo-banner";
import { Panel, Stat, StatusChip } from "@/components/ui";
import { useProgramme } from "@/lib/use-programme";

export default function OverviewPage() {
  const { snapshot, loading, error } = useProgramme();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[26px] border border-line bg-surface px-6 py-10 sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <div className="label mb-4 text-accent">Fieldrail · Programme disbursement infrastructure</div>
            <h1 className="font-[family-name:var(--font-display)] text-[42px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[58px]">
              Purpose in every payment.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-inksoft">
              FIELDRAIL turns restricted programme budgets into enforceable on-chain payment rules. Field teams and
              constrained agents can pay approved suppliers in tUSD8 — without ever being able to spend outside the
              programme&apos;s mandate.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/operations" className="btn-primary moving-border text-sm">
                Run the live payment journey →
              </Link>
              <Link href="/programme" className="btn-quiet text-sm">
                Inspect the programme
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="chip">QDay Aevum testnet</span>
              <span className="chip">tUSD8 · 6 decimals</span>
              <span className="chip">Supplier-signed invoices</span>
              <span className="chip">No arbitrary agent transfer</span>
            </div>
          </div>
          <div className="panel p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="label">The allocation rail</div>
              <StatusChip status={snapshot.status} />
            </div>
            <AllocationRail funded={snapshot.funded} />
          </div>
        </div>
      </section>

      <DataModeBanner />

      {error && <div className="text-sm text-danger">RPC read error: {error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Funded" value={`${formatAmount(snapshot.funded)} tUSD8`} sub="Sponsor deposit" />
        <Stat label="Spent" value={`${formatAmount(snapshot.spent)} tUSD8`} sub="Signed invoices only" tone="copper" />
        <Stat label="Remaining" value={`${formatAmount(snapshot.remaining)} tUSD8`} sub="Across all envelopes" tone="accent" />
        <Stat label="Programme" value={loading ? "…" : snapshot.status} sub={snapshot.title} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            n: "01",
            title: "Partition by purpose",
            body: "Programme → expense category → field team. Each envelope has its own cap and spent counter; a payment must fit every level at once.",
          },
          {
            n: "02",
            title: "Evidence, not claims",
            body: "The supplier signs an EIP-712 invoice binding programme, team, category, amount, payee, nonce, evidence hash and deadline.",
          },
          {
            n: "03",
            title: "Bounded agent authority",
            body: "A scoped agent can only call payInvoice. There is no generic transfer method, and every rejection is emitted on-chain.",
          },
        ].map((item) => (
          <Panel key={item.n} kicker={item.n} title={item.title}>
            <p className="text-sm leading-relaxed text-inksoft">{item.body}</p>
          </Panel>
        ))}
      </section>

      <Panel title="Try the two outcomes that matter" kicker="Demo sequence">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="label text-accent">Success path</div>
            <p className="mt-2 text-sm text-inksoft">
              Supplier signs a water invoice for North Zone. The agent submits it. The contract checks all nine policy
              gates, transfers tUSD8, and the explorer receipt is shown.
            </p>
            <Link href="/operations" className="mt-4 inline-block text-sm font-semibold text-accent underline underline-offset-4">
              Open field operations →
            </Link>
          </div>
          <div className="rounded-xl border border-copper/30 bg-copper/5 p-4">
            <div className="label text-copper">Blocked path</div>
            <p className="mt-2 text-sm text-inksoft">
              Point the same mandate at an unapproved vendor or an exhausted envelope. The UI explains why and the
              contract rejects the call — the denial is simulated with an explicit eth_call, never faked.
            </p>
            <Link href="/operations#blocked" className="mt-4 inline-block text-sm font-semibold text-copper underline underline-offset-4">
              See policy denials →
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
