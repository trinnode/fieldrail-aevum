import { keccak256, toHex } from "viem";

export type Hex = `0x${string}`;
export type Bytes32 = Hex;

/** Canonical invoice wire format. Field order is consensus-critical. */
export type Invoice = {
  programmeId: Bytes32;
  invoiceId: Bytes32;
  teamId: Bytes32;
  categoryId: Bytes32;
  supplier: Hex;
  token: Hex;
  amount: bigint;
  evidenceHash: Bytes32;
  nonce: bigint;
  deadline: bigint;
};

export type ProgrammeStatus = "Active" | "Paused" | "Closed";

export type PaymentState =
  | "Draft"
  | "Awaiting signature"
  | "Submitted"
  | "Confirmed"
  | "Failed"
  | "Blocked by policy";

export type BudgetLine = {
  id: Bytes32;
  label: string;
  cap: bigint;
  spent: bigint;
  remaining: bigint;
};

export type SupplierRecord = {
  address: Hex;
  categoryId: Bytes32;
  label: string;
  active: boolean;
  metadataHash: Bytes32;
};

export type AgentMandate = {
  agent: Hex;
  teamId: Bytes32;
  categoryId: Bytes32;
  perInvoiceCap: bigint;
  cumulativeCap: bigint;
  spent: bigint;
  expiresAt: bigint;
  active: boolean;
};

export type AuditEntry = {
  invoiceId: Bytes32;
  programmeId: Bytes32;
  teamId: Bytes32;
  categoryId: Bytes32;
  supplier: Hex;
  agent: Hex;
  amount: bigint;
  evidenceHash: Bytes32;
  nonce: bigint;
  transactionHash: Hex;
  blockNumber: bigint;
  timestamp?: number;
};

/** Same derivation as Solidity keccak256(bytes(value)). */
export function bytes32(value: string): Bytes32 {
  return keccak256(toHex(value));
}

export function shortHex(value: string, lead = 6, tail = 4): string {
  if (!value || value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead + 2)}…${value.slice(-tail)}`;
}
