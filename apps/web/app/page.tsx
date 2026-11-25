"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { CardBody, CardContainer, CardItem } from "@/components/aceternity/3d-card";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { Button as MovingBorderButton } from "@/components/aceternity/moving-border";
import { AllocationRail } from "@/components/allocation-rail";
import { BrandMark } from "@/components/brand-mark";
import { DataModeBanner } from "@/components/demo-banner";
import { Notice, Panel, Stat, StatusChip } from "@/components/ui";
import { formatAmount } from "@fieldrail/contracts-client";
import { useProgramme } from "@/lib/use-programme";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBooks,
  IconCircleCheck,
  IconFingerprint,
  IconLock,
  IconRoute,
  IconShieldCheck,
  IconTimeline,
} from "@tabler/icons-react";

const BackgroundBeams = dynamic(
  () => import("@/components/aceternity/background-beams").then((m) => m.BackgroundBeams),
  { ssr: false },
);
const Spotlight = dynamic(() => import("@/components/aceternity/spotlight-new").then((m) => m.Spotlight), {
  ssr: false,
});
const TextGenerateEffect = dynamic(
  () => import("@/components/aceternity/text-generate-effect").then((m) => m.TextGenerateEffect),
  { ssr: false, loading: () => <span className="opacity-60">Every disbursement has a route, a budget and a signature.</span> },
);

export default function OverviewPage() {
  const { snapshot, loading, error } = useProgramme();
  const [activeEnvelope, setActiveEnvelope] = useState(0);

  return (
    <div className="space-y-0">
      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative -mt-8 overflow-hidden rounded-[28px] border border-line bg-surface">
        <div className="absolute inset-0 opacity-[0.55]">
          <BackgroundBeams className="!opacity-70" />
        </div>
        <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-forest/10 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-copperlight blur-[100px]" />

        <div className="relative grid grid-cols-1 gap-12 px-7 py-16 sm:px-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-8 lg:py-24">
          <div className="fade-up min-w-0">
            <div className="mb-8 flex items-center gap-3">
              <span className="chip-solid">QDay Aevum · Builder Challenge #1</span>
              <span className="text-xs text-muted">Testnet prototype · 2026</span>
            </div>

            <p className="kicker mb-5">Programme disbursement infrastructure</p>
            <h1 className="display text-[clamp(3.1rem,7.2vw,6.1rem)]">
              Purpose in
              <br />
              <span className="text-forest">every payment.</span>
            </h1>

            <div className="mt-7 max-w-xl font-[family-name:var(--font-display)] text-[clamp(1.1rem,2vw,1.55rem)] font-medium text-inksoft">
              <TextGenerateEffect words="Every disbursement has a route, a budget and a signature." duration={0.42} />
            </div>

            <p className="mt-6 max-w-lg text-[15px] leading-[1.75] text-inksoft">
              FIELDRAIL partitions restricted programme funds into enforceable envelopes. Field teams and bounded agents
              can pay approved suppliers in tUSD8 — but never outside the mandate the funder defined.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <MovingBorderButton
                as="a"
                href="/operations"
                borderRadius="11px"
                duration={4200}
                containerClassName="!h-12 !w-auto !text-sm"
                className="!border-ink !bg-ink !text-white !text-[13px] !font-semibold"
              >
                <span className="flex items-center gap-2 px-4">
                  Run the live journey <IconArrowRight size={15} />
                </span>
              </MovingBorderButton>
              <Link href="/programme" className="btn-quiet flex items-center gap-2">
                Inspect the programme <IconArrowUpRight size={15} />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              <span className="chip">Aevum · 44005</span>
              <span className="chip">tUSD8 · 6 decimals</span>
              <span className="chip">EIP-712 supplier signature</span>
              <span className="chip">No arbitrary agent transfer</span>
            </div>
          </div>

          {/* 3D programme passport — the one meaningful 3D metaphor */}
          <div className="flex min-w-0 justify-center lg:justify-end">
            <CardContainer className="!h-[360px] !w-full max-w-[460px] sm:!h-[400px]">
              <CardBody className="relative h-full w-full rounded-[20px] border border-ink/10 bg-ink p-7 text-white shadow-[0_40px_80px_-48px_rgba(15,26,34,0.85)]">
                <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(420px_220px_at_90%_-10%,rgba(47,124,98,0.45),transparent_70%)]" />
                <CardItem translateZ={40} className="!block">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.22em] text-white/50">PROGRAMME PASSPORT</div>
                      <div className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                        Northern Water Access
                      </div>
                      <div className="text-xs text-white/50">Field Operations Demo · synthetic</div>
                    </div>
                    <BrandMark className="h-8 w-8 text-forestlight" />
                  </div>
                </CardItem>

                <CardItem translateZ={65} className="!mt-8 !block">
                  <div className="num text-[54px] leading-none tracking-tight text-white">
                    {formatAmount(snapshot.funded)}
                  </div>
                  <div className="mt-1 text-xs tracking-[0.18em] text-forestlight">tUSD8 COMMITTED</div>
                </CardItem>

                <CardItem translateZ={30} className="!mt-7 !block">
                  <div className="space-y-2.5">
                    {snapshot.categories.slice(0, 3).map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="num w-5 text-[10px] text-white/40">0{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-white/75">{c.label}</span>
                        <span className="num text-[12px] text-white/90">{formatAmount(c.cap)}</span>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full bg-forestlight"
                            style={{ width: `${Math.min(100, Number((c.spent * 100n) / (c.cap || 1n))) + 8}%` }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </CardItem>

                <CardItem translateZ={50} className="!absolute !bottom-6 !left-7 !right-7 !block">
                  <div className="flex items-center justify-between gap-3 whitespace-nowrap border-t border-white/10 pt-4 text-[11px]">
                    <span className="flex items-center gap-2 text-white/55">
                      <span className="h-1.5 w-1.5 rounded-full bg-forestlight" /> Envelope hierarchy active
                    </span>
                    <span className="num text-white/55">3 categories · 2 teams</span>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t border-line bg-surface/70 md:grid-cols-4">
          {[
            ["Chain", "44005 · Aevum"],
            ["Token", "tUSD8 · 6 dp"],
            ["Policy gates", "20+ checks"],
            ["Agent path", "payInvoice only"],
          ].map(([k, v], i) => (
            <div key={k} className={`px-6 py-4 ${i < 3 ? "border-r border-line" : ""}`}>
              <div className="label">{k}</div>
              <div className="num mt-1 text-sm text-ink">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-8">
        <DataModeBanner />
      </div>

      {error && <div className="mt-6 text-sm text-copper">RPC read error: {error}</div>}

      {/* ---------------------------------------------------------------- */}
      {/* THE PROBLEM — editorial, not a grid of cards                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid gap-10 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="kicker mb-5">01 / The gap</p>
          <h2 className="display text-[clamp(2rem,4vw,3.4rem)]">
            Authorised purpose.
            <br />
            <span className="text-muted">Unenforced execution.</span>
          </h2>
        </div>
        <div className="space-y-0">
          {[
            {
              n: "01",
              t: "A budget is recorded, not enforced",
              d: "Spreadsheets and approval emails describe what should happen. They cannot stop a wallet from paying the wrong vendor, under the wrong programme, after the budget is gone.",
            },
            {
              n: "02",
              t: "A spending cap is not a mandate",
              d: "A capped key answers 'how much' and 'to which addresses'. It cannot answer 'for this team, this category, this invoice, this evidence, before expiry'.",
            },
            {
              n: "03",
              t: "Reconciliation happens afterwards",
              d: "The audit trail is rebuilt by hand once money has moved. FIELDRAIL makes the policy check a precondition of the transfer itself.",
            },
          ].map((item) => (
            <div key={item.n} className="grid grid-cols-[56px_1fr] gap-5 border-t border-line py-6 first:border-t-0 first:pt-0">
              <span className="num pt-1 text-xs text-forest">{item.n}</span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">{item.t}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-inksoft">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* THE RAIL                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="panel relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <Spotlight
          gradientFirst="radial-gradient(68% 68% at 55% 31%, rgba(47,124,98,.12) 0, rgba(47,124,98,.03) 50%, transparent 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(180,110,56,.08) 0, rgba(180,110,56,.02) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, rgba(47,124,98,.05) 0, rgba(47,124,98,.015) 80%, transparent 100%)"
          width={520}
          height={1200}
          duration={8}
        />
        <div className="relative">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-3">02 / The mechanism</p>
              <h2 className="display text-[clamp(1.9rem,3.6vw,3rem)]">One fund. Many bounded routes.</h2>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip status={snapshot.status} />
              <span className="text-xs text-muted">North Zone · water envelope</span>
            </div>
          </div>
          <AllocationRail funded={snapshot.funded} />
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-5 text-xs text-inksoft">
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-forest" />Category cap</span>
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-forestmid" />Team allocation</span>
            <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-copper" />Unallocated reserve — unreachable by agents</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* BENTO — what is enforced                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker mb-3">03 / Enforcement</p>
            <h2 className="display text-[clamp(1.9rem,3.6vw,3rem)]">Every condition is checked at execution.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-inksoft">
            The UI explains; the contract decides. Nine simultaneous conditions must hold before a single base unit moves.
          </p>
        </div>

        <BentoGrid className="md:auto-rows-[13.5rem]">
          {[
            {
              icon: <IconRoute size={18} />,
              title: "Nested envelopes",
              desc: "Programme → category → field team. A payment must fit every level's remaining budget at once.",
              span: "md:col-span-2",
              tone: "forest",
            },
            {
              icon: <IconFingerprint size={18} />,
              title: "Supplier signature",
              desc: "EIP-712 binds the quote to vault, chain, team, category, payee, nonce and evidence hash.",
              span: "",
              tone: "copper",
            },
            {
              icon: <IconLock size={18} />,
              title: "One agent path",
              desc: "No arbitrary transfer. A scoped mandate can only submit a signed invoice.",
              span: "",
              tone: "ink",
            },
            {
              icon: <IconTimeline size={18} />,
              title: "Freshness & replay",
              desc: "Invoice deadline, programme expiry, consumed invoice ID and supplier nonce are checked before transfer.",
              span: "md:col-span-2",
              tone: "forest",
            },
            {
              icon: <IconShieldCheck size={18} />,
              title: "Sponsor control",
              desc: "Pause, revoke, close and refund — with funds never silently redirected.",
              span: "",
              tone: "copper",
            },
          ].map((item, i) => (
            <BentoGridItem
              key={item.title}
              className={`${item.span} group !rounded-2xl !border-line !bg-surface transition-transform duration-300 hover:-translate-y-1`}
              title={
                <span className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  {item.icon}
                  {item.title}
                </span>
              }
              description={<span className="text-[13px] leading-relaxed text-inksoft">{item.desc}</span>}
              header={
                <div
                  className={`h-full min-h-[52px] w-full rounded-xl ${
                    item.tone === "forest"
                      ? "bg-gradient-to-br from-forestlight to-transparent"
                      : item.tone === "copper"
                        ? "bg-gradient-to-br from-copperlight to-transparent"
                        : "bg-gradient-to-br from-ink/10 to-transparent"
                  }`}
                >
                  <div className="num p-3 text-[10px] tracking-[0.2em] text-muted">GATE {String(i + 1).padStart(2, "0")}</div>
                </div>
              }
            />
          ))}
        </BentoGrid>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ENVELOPE EXPLORER                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="kicker mb-3">04 / Budget anatomy</p>
          <h2 className="display text-[clamp(1.9rem,3.6vw,3rem)]">Three envelopes. One reserve nobody can touch.</h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-inksoft">
            Select an envelope to see its cap, spend and remaining allocation. The 100 tUSD8 contingency is outside every
            category and every mandate — it can only be moved by the sponsor under the documented closure rule.
          </p>
          <div className="mt-8 space-y-2">
            {snapshot.categories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveEnvelope(i)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  activeEnvelope === i
                    ? "border-forest bg-forestlight/60"
                    : "border-line bg-surface hover:border-forestmid hover:bg-forestlight/30"
                }`}
              >
                <span className="text-sm font-medium">{c.label}</span>
                <span className="num text-xs">{formatAmount(c.remaining)} left</span>
              </button>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-dashed border-copper/50 px-4 py-3">
              <span className="text-sm text-copper">Unallocated reserve</span>
              <span className="num text-xs text-copper">100.00 tUSD8</span>
            </div>
          </div>
        </div>
        <Panel kicker="Selected envelope" title={snapshot.categories[activeEnvelope]?.label ?? "Envelope"}>
          {(() => {
            const c = snapshot.categories[activeEnvelope];
            if (!c) return null;
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Cap" value={formatAmount(c.cap)} />
                  <Stat label="Spent" value={formatAmount(c.spent)} sub="Signed invoices" tone="copper" />
                  <Stat label="Remaining" value={formatAmount(c.remaining)} tone="accent" />
                </div>
                <div className="space-y-3">
                  {snapshot.teams
                    .filter((t) => t.allocations.some((a) => a.id === c.id))
                    .map((t) => {
                      const a = t.allocations.find((x) => x.id === c.id)!;
                      return (
                        <div key={t.id} className="rounded-xl border border-line bg-[#fbfaf7] p-4">
                          <div className="mb-2 flex justify-between text-sm">
                            <span className="font-medium">{t.label}</span>
                            <span className="num text-xs text-inksoft">{formatAmount(a.remaining)} available</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-line">
                            <div
                              className="h-full rounded-full bg-forest"
                              style={{ width: `${Math.min(100, Number((a.spent * 100n) / (a.cap || 1n))) + 4}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <Notice tone="info">
                  A payment above this envelope&apos;s remaining balance is rejected by the contract even when the programme
                  itself still holds funds. That envelope-level denial is FIELDRAIL&apos;s narrow wedge.
                </Notice>
              </div>
            );
          })()}
        </Panel>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* TWO OUTCOMES                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-24">
        <p className="kicker mb-3">05 / Demonstrable outcomes</p>
        <h2 className="display mb-10 text-[clamp(1.9rem,3.6vw,3rem)]">The success and the refusal, both on-chain.</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[20px] border border-forest/25 bg-forestlight/40 p-7">
            <div className="mb-4 flex items-center gap-2 text-forest">
              <IconCircleCheck size={18} /> <span className="label !text-forest">Accepted</span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">1.00 tUSD8 to Apex Water Works</h3>
            <p className="mt-3 text-sm leading-relaxed text-inksoft">
              Supplier signs. Agent submits. Nineteen gates pass. The vault emits <code className="num">InvoicePaid</code> and
              transfers tUSD8. The receipt links to the explorer.
            </p>
            <div className="num mt-6 rounded-xl bg-ink px-4 py-3 text-[11px] leading-relaxed text-forestlight">
              payInvoice → InvoicePaid → Transfer(1.00 tUSD8)
            </div>
            <Link href="/operations" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest link-underline">
              Run the payment <IconArrowRight size={15} />
            </Link>
          </div>
          <div className="rounded-[20px] border border-copper/30 bg-copperlight/40 p-7">
            <div className="mb-4 flex items-center gap-2 text-copper">
              <IconLock size={18} /> <span className="label !text-copper">Blocked</span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">North Zone has 12.00 tUSD8 left</h3>
            <p className="mt-3 text-sm leading-relaxed text-inksoft">
              The invoice requests 18.00. The category still has room, but the team envelope does not. The contract reverts;
              the UI shows the exact plain-language reason.
            </p>
            <div className="num mt-6 rounded-xl bg-ink px-4 py-3 text-[11px] leading-relaxed text-copperlight">
              revert TeamBudgetExceeded() · no token transfer
            </div>
            <Link href="/operations#blocked" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-copper link-underline">
              See the denials <IconArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PROCESS                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-line py-20">
        <p className="kicker mb-3">06 / The journey</p>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {[
            ["01", "Fund", "Sponsor deposits 1,000 tUSD8 into a fresh vault."],
            ["02", "Partition", "Categories, teams, suppliers and a scoped mandate."],
            ["03", "Quote", "Supplier signs an invoice with evidence hash."],
            ["04", "Execute", "Agent submits one constrained contract call."],
            ["05", "Verify", "Receipt, ledger and remaining budgets update."],
          ].map(([n, t, d], i) => (
            <div key={n} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="num text-xs text-forest">{n}</span>
                <span className={`h-px flex-1 ${i === 4 ? "bg-transparent" : "bg-line"}`} />
              </div>
              <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">{t}</h4>
              <p className="mt-2 text-xs leading-relaxed text-inksoft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CLOSING                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-24 text-center">
        <IconBooks className="mx-auto mb-6 text-forest" size={28} />
        <h2 className="display mx-auto max-w-3xl text-[clamp(2rem,4.6vw,3.8rem)]">
          Built for the moment a programme must prove <span className="text-forest">where every unit went.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-inksoft">
          A testnet prototype with an intentionally narrow wedge: purpose-bound budgets, supplier-signed procurement and a
          constrained agent. Not a wallet, not a checkout, not a claim about post-quantum security.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn-primary">Create a programme</Link>
          <Link href="/settings" className="btn-quiet">Check deployment status</Link>
        </div>
      </section>
    </div>
  );
}
