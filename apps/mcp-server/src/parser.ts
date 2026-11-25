import { bytes32 } from "@fieldrail/shared-types";
import type { InvoiceInput } from "./fieldrail";

export type ParsedRequest = {
  ok: boolean;
  draft: Partial<InvoiceInput> | null;
  missing: string[];
  warnings: string[];
};

/**
 * Deterministic, no-key natural-language extraction. Deliberately conservative:
 * ambiguity or missing vendor/amount stops and asks for human review. This
 * layer never modifies contract state or claims payment eligibility.
 */
export function parseProcurementRequest(text: string): ParsedRequest {
  const warnings: string[] = [];
  const draft: Partial<InvoiceInput> = {};
  const missing: string[] = [];
  const lower = text.toLowerCase();

  const amountMatch = lower.match(/(\d+(?:\.\d{1,6})?)\s*(?:tusd8|usd|tokens?)?/);
  if (amountMatch) {
    const [whole, frac = ""] = amountMatch[1].split(".");
    draft.amount = (BigInt(whole) * 1_000_000n + BigInt(frac.padEnd(6, "0"))).toString();
  } else missing.push("amount");

  const teamMatch = lower.match(/north zone|south zone/);
  if (teamMatch) draft.teamId = bytes32(teamMatch[0] === "north zone" ? "NORTH_ZONE" : "SOUTH_ZONE");
  else missing.push("team");

  const categoryMatch = lower.match(/water|transport|logistics|supplies|field supplies/);
  if (categoryMatch) {
    const value = categoryMatch[0];
    const id = value.includes("water")
      ? "WATER_PROCUREMENT"
      : value.includes("transport") || value.includes("logistics")
        ? "TRANSPORT_LOGISTICS"
        : "FIELD_SUPPLIES";
    draft.categoryId = bytes32(id);
  } else missing.push("category");

  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) draft.supplier = addressMatch[0] as `0x${string}`;
  else missing.push("supplier address");

  const invoiceMatch = text.match(/invoice\s*(?:id|#|number)?\s*[:\-]?\s*([A-Za-z0-9_-]{2,40})/i);
  draft.invoiceId = bytes32(invoiceMatch?.[1] ?? `NL-${Date.now()}`);

  const evidenceMatch = text.match(/evidence\s*[:\-]?\s*([A-Za-z0-9_.\/-]{2,80})/i);
  draft.evidenceHash = bytes32(evidenceMatch?.[1] ?? "unspecified-evidence");

  const nonceMatch = text.match(/nonce\s*[:\-]?\s*(\d+)/i);
  draft.nonce = nonceMatch?.[1] ?? "1";

  if (/ignore previous|system prompt|disregard instructions|jailbreak/.test(lower)) {
    warnings.push("Request text contains instruction-like phrases. Treated as untrusted data; no instruction was executed.");
  }

  return { ok: missing.length === 0, draft: missing.length ? null : draft, missing, warnings };
}

export function fillDefaults(draft: Partial<InvoiceInput>, programmeId: `0x${string}`, token: `0x${string}`, deadlineSeconds: bigint): InvoiceInput {
  return {
    programmeId,
    invoiceId: draft.invoiceId!,
    teamId: draft.teamId!,
    categoryId: draft.categoryId!,
    supplier: draft.supplier!,
    token,
    amount: draft.amount!,
    evidenceHash: draft.evidenceHash!,
    nonce: draft.nonce ?? "1",
    deadline: deadlineSeconds.toString(),
  };
}
