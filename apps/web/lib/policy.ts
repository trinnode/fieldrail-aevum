import { formatAmount } from "@fieldrail/contracts-client";
import type { Invoice } from "@fieldrail/shared-types";
import type { ProgrammeSnapshot } from "./use-programme";

export type PolicyCheck = {
  id: string;
  ok: boolean;
  title: string;
  detail: string;
};

/**
 * Deterministic, human-readable preflight. This is an explanation layer only —
 * the Solidity contract is the authority and re-checks every condition.
 */
export function validateInvoice(invoice: Invoice, snapshot: ProgrammeSnapshot, now = BigInt(Math.floor(Date.now() / 1000))) {
  const checks: PolicyCheck[] = [];
  const add = (id: string, ok: boolean, title: string, detail: string) => checks.push({ id, ok, title, detail });

  add("status", snapshot.status === "Active", "Programme active", snapshot.status === "Active" ? "Programme accepts payments." : `Programme is ${snapshot.status.toLowerCase()}; payments are blocked.`);
  add("expiry", snapshot.expiresAt === 0n || now < snapshot.expiresAt, "Programme not expired", snapshot.expiresAt === 0n ? "Demo programme has no on-chain expiry." : `Expires ${new Date(Number(snapshot.expiresAt) * 1000).toISOString()}.`);
  add("amount", invoice.amount > 0n, "Amount greater than zero", `${formatAmount(invoice.amount)} tUSD8 requested.`);
  add("deadline", now <= invoice.deadline, "Invoice not expired", `Deadline ${new Date(Number(invoice.deadline) * 1000).toISOString()}.`);

  const supplier = snapshot.suppliers.find((s) => s.address.toLowerCase() === invoice.supplier.toLowerCase() && s.categoryId === invoice.categoryId);
  add("supplier", Boolean(supplier), "Supplier approved for category", supplier ? `${supplier.label} is approved for this category.` : "This supplier is not approved for the selected expense category.");

  const mandate = snapshot.mandate;
  add("mandate", Boolean(mandate?.active), "Agent mandate active", mandate?.active ? "Mandate is active." : "No active mandate for this wallet.");
  if (mandate) {
    add("scope", mandate.teamId === invoice.teamId && mandate.categoryId === invoice.categoryId, "Agent scope matches", "Agent must match both the team and category on the invoice.");
    add("perInvoice", invoice.amount <= mandate.perInvoiceCap, "Within per-invoice cap", `${formatAmount(invoice.amount)} vs ${formatAmount(mandate.perInvoiceCap)} tUSD8 maximum.`);
    add("lifetime", mandate.spent + invoice.amount <= mandate.cumulativeCap, "Within lifetime cap", `${formatAmount(mandate.spent + invoice.amount)} vs ${formatAmount(mandate.cumulativeCap)} tUSD8 cumulative.`);
  }

  const category = snapshot.categories.find((c) => c.id === invoice.categoryId);
  add("category", Boolean(category && invoice.amount <= category.remaining), "Category envelope funded", category ? `${formatAmount(category.remaining)} tUSD8 remaining in ${category.label}; invoice requests ${formatAmount(invoice.amount)}.` : "Unknown category.");

  const team = snapshot.teams.find((t) => t.id === invoice.teamId);
  const allocation = team?.allocations.find((a) => a.id === invoice.categoryId);
  add("allocation", Boolean(allocation && invoice.amount <= allocation.remaining), "Team allocation funded", allocation ? `${formatAmount(allocation.remaining)} tUSD8 remaining for ${team?.label} in this category.` : "No allocation for this team and category.");

  add("programme", invoice.amount <= snapshot.remaining, "Programme balance sufficient", `${formatAmount(snapshot.remaining)} tUSD8 remains in the programme vault.`);

  return checks;
}

export function firstFailure(checks: PolicyCheck[]): PolicyCheck | undefined {
  return checks.find((c) => !c.ok);
}
