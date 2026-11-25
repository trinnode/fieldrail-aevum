"use client";

import { formatAmount } from "@fieldrail/contracts-client";
import { shortHex } from "@fieldrail/shared-types";
import { txUrl } from "@fieldrail/chain-config";
import { DataModeBanner } from "@/components/demo-banner";
import { Notice, Panel, Stat } from "@/components/ui";
import { useAudit } from "@/lib/use-audit";
import { categoryLabel, teamLabel } from "@/lib/constants";

export default function SupplierPage() {
  const { entries } = useAudit();
  const latest = entries[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Supplier / invoice view</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Invoice evidence and settlement
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-inksoft">
          A quote is only evidence. The supplier&apos;s EIP-712 signature binds it to a programme, team, category, amount,
          payee, nonce, evidence hash and deadline before the agent can submit it.
        </p>
      </div>
      <DataModeBanner />

      {!latest ? (
        <Notice tone="info">No invoice has been settled yet. Run the field operations journey first.</Notice>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat label="Invoice" value={shortHex(latest.invoiceId, 10, 6)} sub="EIP-712 signed identifier" />
            <Stat label="Amount" value={`${formatAmount(latest.amount)} tUSD8`} sub="Paid to approved supplier" tone="accent" />
            <Stat label="Nonce" value={latest.nonce.toString()} sub="Single-use merchant nonce" />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel kicker="Signed fields" title="What the supplier actually signed">
              <dl className="divide-y divide-line text-sm">
                {[
                  ["Programme", "Northern Water Access — Field Operations Demo"],
                  ["Invoice ID", shortHex(latest.invoiceId, 12, 8)],
                  ["Field team", teamLabel(latest.teamId)],
                  ["Category", categoryLabel(latest.categoryId)],
                  ["Payee", shortHex(latest.supplier)],
                  ["Token", "tUSD8 (6 decimals)"],
                  ["Amount (base units)", latest.amount.toString()],
                  ["Evidence hash", shortHex(latest.evidenceHash, 12, 8)],
                  ["Nonce", latest.nonce.toString()],
                  ["Agent", shortHex(latest.agent)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-inksoft">{k}</dt>
                    <dd className="num text-right text-xs">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel kicker="Settlement" title="Receipt and status">
              {latest.transactionHash ? (
                <>
                  <Notice tone="ok">
                    Confirmed on Aevum in block {latest.blockNumber?.toString()}. The contract emitted InvoicePaid before
                    the tUSD8 transfer completed.
                  </Notice>
                  <a
                    className="btn-quiet mt-4 inline-block text-sm"
                    href={txUrl(latest.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open explorer receipt ↗
                  </a>
                </>
              ) : (
                <Notice tone="warn">
                  Synthetic demo entry — there is no transaction hash and no settlement. Do not treat this as a receipt.
                </Notice>
              )}
              <div className="mt-5 space-y-2 text-xs text-inksoft">
                <div className="flex justify-between"><span>State</span><span className="font-semibold text-positive">Confirmed</span></div>
                <div className="flex justify-between"><span>Replay protection</span><span>Invoice ID + nonce consumed</span></div>
                <div className="flex justify-between"><span>Evidence</span><span className="num">{shortHex(latest.evidenceHash, 8, 4)}</span></div>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
