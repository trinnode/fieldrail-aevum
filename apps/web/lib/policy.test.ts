import { describe, expect, it } from "vitest";
import { bytes32, type Invoice } from "@fieldrail/shared-types";
import { explainError, formatAmount, parseAmount, toFunctionSelector } from "@fieldrail/contracts-client";
import { validateInvoice, firstFailure } from "./policy";
import type { ProgrammeSnapshot } from "./use-programme";
import { CATEGORIES, TEAMS, PROGRAMME_ID } from "./constants";

const supplier = "0x1111111111111111111111111111111111111111" as const;
const agent = "0x2222222222222222222222222222222222222222" as const;
const now = 1_800_000_000n;

const snapshot: ProgrammeSnapshot = {
  source: "demo",
  vault: null,
  title: "test",
  status: "Active",
  funded: 1_000_000_000n,
  spent: 0n,
  remaining: 1_000_000_000n,
  startAt: 0n,
  expiresAt: 0n,
  sponsor: null,
  categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label, cap: c.cap, spent: 0n, remaining: c.cap })),
  teams: TEAMS.map((t) => ({
    id: t.id,
    label: t.label,
    allocations: t.allocations.map((a) => ({
      id: a.categoryId,
      label: "test",
      cap: a.cap,
      spent: 0n,
      remaining: a.cap,
    })),
  })),
  suppliers: [{ address: supplier, categoryId: CATEGORIES[0].id, label: "test", active: true }],
  mandate: {
    agent,
    teamId: TEAMS[0].id,
    categoryId: CATEGORIES[0].id,
    perInvoiceCap: 100_000_000n,
    cumulativeCap: 300_000_000n,
    spent: 0n,
    expiresAt: 0n,
    active: true,
  },
};

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    programmeId: PROGRAMME_ID,
    invoiceId: bytes32("INV-001"),
    teamId: TEAMS[0].id,
    categoryId: CATEGORIES[0].id,
    supplier,
    token: "0x456569838f1d43009A91ebA4263147Afd7233483",
    amount: 18_000_000n,
    evidenceHash: bytes32("evidence"),
    nonce: 1n,
    deadline: now + 86_400n,
    ...overrides,
  };
}

describe("money helpers", () => {
  it("parses exact 6-decimal amounts into base units", () => {
    expect(parseAmount("18")).toBe(18_000_000n);
    expect(parseAmount("18.000001")).toBe(18_000_001n);
    expect(parseAmount("0.000001")).toBe(1n);
  });

  it("rejects invalid or over-precise amounts", () => {
    expect(() => parseAmount("18.0000001")).toThrow();
    expect(() => parseAmount("-1")).toThrow();
    expect(() => parseAmount("abc")).toThrow();
  });

  it("formats without floating point drift", () => {
    expect(formatAmount(1_000_000_000n)).toBe("1000.00");
    expect(formatAmount(18_000_001n, 6)).toBe("18.000001");
  });
});

describe("deterministic policy preflight", () => {
  it("accepts a valid in-policy invoice", () => {
    const checks = validateInvoice(invoice(), snapshot, now);
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(firstFailure(checks)).toBeUndefined();
  });

  it("rejects an unapproved supplier for the category", () => {
    const checks = validateInvoice(invoice({ supplier: "0x3333333333333333333333333333333333333333" }), snapshot, now);
    expect(firstFailure(checks)?.id).toBe("supplier");
  });

  it("rejects an amount above the team allocation", () => {
    const checks = validateInvoice(invoice({ amount: 301_000_000n }), snapshot, now);
    expect(firstFailure(checks)?.id).toBe("perInvoice");
  });

  it("rejects an expired invoice and a paused programme", () => {
    expect(firstFailure(validateInvoice(invoice({ deadline: now - 1n }), snapshot, now))?.id).toBe("deadline");
    expect(firstFailure(validateInvoice(invoice(), { ...snapshot, status: "Paused" }, now))?.id).toBe("status");
  });

  it("rejects an out-of-scope team", () => {
    const checks = validateInvoice(invoice({ teamId: TEAMS[1].id }), snapshot, now);
    expect(firstFailure(checks)?.id).toBe("scope");
  });
});

describe("error explanation", () => {
  it("maps a custom error selector to plain language", () => {
    const selector = toFunctionSelector("error SupplierNotApproved()");
    const result = explainError(`execution reverted: 0x${selector.slice(2)}`);
    expect(result.code).toBe("SupplierNotApproved");
    expect(result.message).toContain("not approved");
  });
});
