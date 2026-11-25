"use client";

import { useState } from "react";
import { formatAmount } from "@fieldrail/contracts-client";
import { txUrl } from "@fieldrail/chain-config";
import { shortHex } from "@fieldrail/shared-types";
import { DataModeBanner } from "@/components/demo-banner";
import { Notice, Panel } from "@/components/ui";
import { useAudit } from "@/lib/use-audit";
import { categoryLabel, teamLabel } from "@/lib/constants";

export default function AuditPage() {
  const { entries, loading, error } = useAudit();
  const [filter, setFilter] = useState("");

  const filtered = entries.filter((e) =>
    `${e.invoiceId} ${e.supplier} ${e.agent} ${teamLabel(e.teamId)} ${categoryLabel(e.categoryId)}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Audit ledger</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Every settled invoice, with proof
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-inksoft">
          Entries are reconstructed from <code className="num">InvoicePaid</code> events, queried in 900-block pages to
          respect Aevum&apos;s log limit. Each real entry links to its explorer receipt.
        </p>
      </div>
      <DataModeBanner />
      {error && <Notice tone="danger">Log query error: {error}</Notice>}

      <Panel
        kicker="Ledger"
        title={`${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
        action={
          <input
            className="input max-w-xs text-sm"
            placeholder="Filter by team, category, vendor, agent or ID"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        }
      >
        {loading && <p className="text-sm text-muted">Reading paginated logs…</p>}
        {!loading && filtered.length === 0 && <p className="text-sm text-muted">No invoice payments found yet.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
                <th className="py-2 pr-3">Invoice</th>
                <th className="py-2 pr-3">Team / category</th>
                <th className="py-2 pr-3">Supplier</th>
                <th className="py-2 pr-3">Agent</th>
                <th className="py-2 pr-3 text-right">Amount</th>
                <th className="py-2 pr-3">Evidence</th>
                <th className="py-2">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={`${e.transactionHash ?? "demo"}-${i}`} className="border-b border-line/70 last:border-0">
                  <td className="num py-3 pr-3 text-xs">{shortHex(e.invoiceId, 10, 6)}</td>
                  <td className="py-3 pr-3">
                    <div>{teamLabel(e.teamId)}</div>
                    <div className="text-xs text-muted">{categoryLabel(e.categoryId)}</div>
                  </td>
                  <td className="num py-3 pr-3 text-xs">{shortHex(e.supplier)}</td>
                  <td className="num py-3 pr-3 text-xs">{shortHex(e.agent)}</td>
                  <td className="num py-3 pr-3 text-right">{formatAmount(e.amount)}</td>
                  <td className="num py-3 pr-3 text-xs">{shortHex(e.evidenceHash, 8, 4)}</td>
                  <td className="py-3 text-xs">
                    {e.transactionHash ? (
                      <a className="text-accent underline underline-offset-4" href={txUrl(e.transactionHash)} target="_blank" rel="noreferrer">
                        {shortHex(e.transactionHash, 8, 4)} ↗
                      </a>
                    ) : (
                      <span className="text-copper">synthetic · no tx</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
