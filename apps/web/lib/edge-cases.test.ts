import { describe, expect, it } from "vitest";
import { bytes32, type Invoice } from "@fieldrail/shared-types";
import { explainError, parseAmount, formatAmount, toFunctionSelector } from "@fieldrail/contracts-client";
import { validateInvoice, firstFailure } from "./policy";
import type { ProgrammeSnapshot } from "./use-programme";
import { CATEGORIES, TEAMS, PROGRAMME_ID } from "./constants";

/** Hashes independently observed in the Foundry trace of the live-state fork test. */
const SOLIDITY_HASHES = {
  programme: "0x2d7d93f386067af097504465e267b49a531ccd5b4de45a2a2e6d155171bc13de",
  water: "0xf471526339959aa0b22d636dc8ff6f3f450ec2c870398838cfd213aa24f8c117",
  north: "0x3f5df80571ad887bfd6872816c2a86f3c46338e54e3969afb988a390ea17ff61",
};

const supplier = "0x1111111111111111111111111111111111111111" as const;
const agent = "0x2222222222222222222222222222222222222222" as const;
const now = 1_800_000_000n;

function baseSnapshot(): ProgrammeSnapshot {
  return {
    source: "onchain",
    vault: "0x3333333333333333333333333333333333333333",
    title: "test",
    status: "Active",
    funded: 1_000_000_000n,
    spent: 0n,
    remaining: 1_000_000_000n,
    startAt: 0n,
    expiresAt: 0n,
    sponsor: agent,
    categories: CATEGORIES.map((c) => ({ id: c.id, label: c.label, cap: c.cap, spent: 0n, remaining: c.cap })),
    teams: TEAMS.map((t) => ({
      id: t.id,
      label: t.label,
      allocations: t.allocations.map((a) => ({
        id: a.categoryId,
        label: "x",
        cap: a.cap,
        spent: 0n,
        remaining: a.cap,
      })),
    })),
    suppliers: [{ address: supplier, categoryId: CATEGORIES[0].id, label: "x", active: true }],
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
}

function baseInvoice(overrides: Partial<Invoice> = {}): Invoice {
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

describe("identifier parity with Solidity", () => {
  it("derives the same bytes32 identifiers as keccak256 in the contracts", () => {
    expect(bytes32("NORTHERN_WATER_ACCESS_DEMO")).toBe(SOLIDITY_HASHES.programme);
    expect(bytes32("WATER_PROCUREMENT")).toBe(SOLIDITY_HASHES.water);
    expect(bytes32("NORTH_ZONE")).toBe(SOLIDITY_HASHES.north);
    expect(PROGRAMME_ID).toBe(SOLIDITY_HASHES.programme);
  });
});

describe("money edge cases", () => {
  it.each([
    ["0", 0n],
    ["0.000001", 1n],
    ["1", 1_000_000n],
    ["1000.000001", 1_000_000_001n],
    ["999999.999999", 999_999_999_999n],
  ])("parses %s exactly", (input, expected) => {
    expect(parseAmount(input as string)).toBe(expected);
  });

  it.each(["", ".", "1.", "1.0000000", "1e6", "-5", "1,000", "abc"])("rejects malformed %s", (input) => {
    expect(() => parseAmount(input)).toThrow();
  });

  it("truncates display to two decimals without mutating the signed value", () => {
    const raw = 18_009_999n;
    expect(formatAmount(raw)).toBe("18.00");
    expect(formatAmount(raw, 6)).toBe("18.009999");
    expect(raw).toBe(18_009_999n);
  });
});

describe("every policy gate can refuse a payment", () => {
  const cases: Array<[string, (s: ProgrammeSnapshot, i: Invoice) => [ProgrammeSnapshot, Invoice], string]> = [
    ["paused programme", (s) => [{ ...s, status: "Paused" }, baseInvoice()], "status"],
    ["closed programme", (s) => [{ ...s, status: "Closed" }, baseInvoice()], "status"],
    ["expired programme", (s) => [{ ...s, expiresAt: now - 1n }, baseInvoice()], "expiry"],
    ["zero amount", (s, i) => [s, { ...i, amount: 0n }], "amount"],
    ["expired invoice", (s, i) => [s, { ...i, deadline: now - 1n }], "deadline"],
    ["unapproved supplier", (s, i) => [s, { ...i, supplier: "0x4444444444444444444444444444444444444444" }], "supplier"],
    ["wrong category for supplier", (s, i) => [{ ...s }, { ...i, categoryId: CATEGORIES[1].id }], "supplier"],
    ["no mandate", (s) => [{ ...s, mandate: null }, baseInvoice()], "mandate"],
    ["revoked mandate", (s) => [{ ...s, mandate: s.mandate ? { ...s.mandate, active: false } : null }, baseInvoice()], "mandate"],
    ["outside team scope", (s, i) => [s, { ...i, teamId: TEAMS[1].id }], "scope"],
    ["per-invoice cap", (s, i) => [s, { ...i, amount: 100_000_001n }], "perInvoice"],
    ["lifetime cap", (s, i) => [s, { ...i, amount: 18_000_000n }], "lifetime"],
    ["category exhausted", (s, i) => [{ ...s, categories: s.categories.map((c, n) => n === 0 ? { ...c, remaining: 1n } : c) }, i], "category"],
    ["allocation exhausted", (s, i) => [{ ...s, teams: s.teams.map((t, n) => n === 0 ? { ...t, allocations: t.allocations.map((a, k) => k === 0 ? { ...a, remaining: 1n } : a) } : t) }, i], "allocation"],
    ["programme exhausted", (s, i) => [{ ...s, remaining: 1n }, i], "programme"],
  ];

  it.each(cases)("%s", (_label, mutate, expectedId) => {
    const [snapshot, invoice] = mutate(baseSnapshot(), baseInvoice());
    if (expectedId === "lifetime") {
      snapshot.mandate = { ...snapshot.mandate!, spent: 290_000_000n };
    }
    const checks = validateInvoice(invoice, snapshot, now);
    expect(firstFailure(checks)?.id).toBe(expectedId);
  });

  it("accepts a boundary invoice exactly at every remaining cap", () => {
    const snapshot = baseSnapshot();
    const invoice = baseInvoice({ amount: 100_000_000n });
    const checks = validateInvoice(invoice, snapshot, now);
    expect(checks.every((c) => c.ok)).toBe(true);
  });
});

describe("error decoding", () => {
  it.each([
    ["SupplierNotApproved", "not approved"],
    ["TeamBudgetExceeded", "field team"],
    ["InvoiceAlreadyUsed", "already been paid"],
    ["InvalidSupplierSignature", "signature"],
    ["AgentExpired", "expired"],
  ])("maps %s", (name, fragment) => {
    const selector = toFunctionSelector(`error ${name}()`);
    const result = explainError(`execution reverted: 0x${selector.slice(2)} ${selector}`);
    expect(result.code).toBe(name);
    expect(result.message.toLowerCase()).toContain(fragment.toLowerCase());
  });
});
