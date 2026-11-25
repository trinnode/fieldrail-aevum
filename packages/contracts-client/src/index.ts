import { formatUnits, parseUnits, parseAbi, toFunctionSelector } from "viem";
import type { Invoice } from "@fieldrail/shared-types";
import { TUSD8_DECIMALS } from "@fieldrail/chain-config";

/* ------------------------------------------------------------------ */
/* ABIs — human readable, parsed by viem. Keep in sync with contracts/  */
/* ------------------------------------------------------------------ */

export const vaultAbi = parseAbi([
  "function sponsor() view returns (address)",
  "function paymentToken() view returns (address)",
  "function programmeId() view returns (bytes32)",
  "function programmeMetadataHash() view returns (bytes32)",
  "function startAt() view returns (uint256)",
  "function expiresAt() view returns (uint256)",
  "function status() view returns (uint8)",
  "function totalFunded() view returns (uint256)",
  "function totalSpent() view returns (uint256)",
  "function refunded() view returns (uint256)",
  "function closedAt() view returns (uint256)",
  "function categoryCap(bytes32) view returns (uint256)",
  "function categorySpent(bytes32) view returns (uint256)",
  "function categoryAllocated(bytes32) view returns (uint256)",
  "function teamRegistered(bytes32) view returns (bool)",
  "function teamMetadataHash(bytes32) view returns (bytes32)",
  "function teamCategoryCap(bytes32, bytes32) view returns (uint256)",
  "function teamCategorySpent(bytes32, bytes32) view returns (uint256)",
  "function suppliers(address, bytes32) view returns (bool active, bytes32 metadataHash, uint256 registeredAt)",
  "function mandates(address) view returns (bool active, bytes32 teamId, bytes32 categoryId, uint256 perInvoiceCap, uint256 cumulativeCap, uint256 spent, uint256 expiresAt)",
  "function consumedInvoiceIds(bytes32) view returns (bool)",
  "function consumedNonces(address, uint256) view returns (bool)",
  "function getCategoryRemaining(bytes32) view returns (uint256)",
  "function getTeamCategoryRemaining(bytes32, bytes32) view returns (uint256)",
  "function getFundsRemaining() view returns (uint256)",
  "function getAgentRemaining(address) view returns (uint256 perInvoiceCap, uint256 lifetimeRemaining, uint256 expiry, bool active)",
  "function isSupplierApproved(address, bytes32) view returns (bool)",
  "function isInvoiceConsumed(bytes32) view returns (bool)",
  "function isNonceConsumed(address, uint256) view returns (bool)",
  "function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)",
  "function hashInvoice((bytes32 programmeId, bytes32 invoiceId, bytes32 teamId, bytes32 categoryId, address supplier, address token, uint256 amount, bytes32 evidenceHash, uint256 nonce, uint256 deadline) invoice) view returns (bytes32)",
  "function fund(uint256 amount)",
  "function configureCategory(bytes32 categoryId, uint256 cap)",
  "function registerTeam(bytes32 teamId, bytes32 metadataHash)",
  "function allocateTeam(bytes32 teamId, bytes32 categoryId, uint256 cap)",
  "function registerSupplier(address supplier, bytes32 categoryId, bytes32 metadataHash)",
  "function revokeSupplier(address supplier, bytes32 categoryId)",
  "function authoriseAgent(address agent, bytes32 teamId, bytes32 categoryId, uint256 perInvoiceCap, uint256 cumulativeCap, uint256 expiresAt)",
  "function revokeAgent(address agent)",
  "function payInvoice((bytes32 programmeId, bytes32 invoiceId, bytes32 teamId, bytes32 categoryId, address supplier, address token, uint256 amount, bytes32 evidenceHash, uint256 nonce, uint256 deadline) invoice, bytes supplierSignature)",
  "function pauseProgramme()",
  "function resumeProgramme()",
  "function closeProgramme()",
  "function refundUnspent()",
  "event ProgramFunded(bytes32 indexed programmeId, address indexed sponsor, uint256 amount, uint256 totalFunded)",
  "event CategoryConfigured(bytes32 indexed categoryId, uint256 cap)",
  "event TeamRegistered(bytes32 indexed teamId, bytes32 metadataHash)",
  "event TeamAllocationConfigured(bytes32 indexed teamId, bytes32 indexed categoryId, uint256 cap)",
  "event SupplierRegistered(address indexed supplier, bytes32 indexed categoryId, bytes32 metadataHash)",
  "event SupplierRevoked(address indexed supplier, bytes32 indexed categoryId)",
  "event AgentAuthorised(address indexed agent, bytes32 indexed teamId, bytes32 indexed categoryId, uint256 perInvoiceCap, uint256 cumulativeCap, uint256 expiresAt)",
  "event AgentRevoked(address indexed agent)",
  "event InvoicePaid(bytes32 indexed invoiceId, bytes32 indexed programmeId, bytes32 indexed teamId, bytes32 categoryId, address supplier, address agent, uint256 amount, bytes32 evidenceHash, uint256 nonce)",
  "event ProgrammePaused(bytes32 indexed programmeId, address indexed sponsor)",
  "event ProgrammeResumed(bytes32 indexed programmeId, address indexed sponsor)",
  "event ProgrammeClosed(bytes32 indexed programmeId, uint256 closedAt, uint256 unspent)",
  "event Refunded(bytes32 indexed programmeId, address indexed sponsor, uint256 amount)"
]);

export const factoryAbi = parseAbi([
  "function vaultOfProgramme(bytes32) view returns (address)",
  "function getProgrammes() view returns (address[])",
  "function programmeCount() view returns (uint256)",
  "function createProgramme(bytes32 programmeId, address token, bytes32 metadataHash, uint256 startAt, uint256 expiresAt) returns (address vault)",
  "event ProgramCreated(bytes32 indexed programmeId, address indexed vault, address indexed sponsor, address token, bytes32 metadataHash)"
]);

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
]);

/* ------------------------------------------------------------------ */
/* EIP-712 typed data                                                  */
/* ------------------------------------------------------------------ */

export const invoiceTypes = {
  Invoice: [
    { name: "programmeId", type: "bytes32" },
    { name: "invoiceId", type: "bytes32" },
    { name: "teamId", type: "bytes32" },
    { name: "categoryId", type: "bytes32" },
    { name: "supplier", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "evidenceHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Money helpers — never use JS number for money                       */
/* ------------------------------------------------------------------ */

export function formatAmount(value: bigint, decimals = 2): string {
  const full = formatUnits(value, TUSD8_DECIMALS);
  if (decimals === 6) return full;
  const [whole, frac = ""] = full.split(".");
  const cut = frac.slice(0, decimals).padEnd(decimals, "0");
  return decimals === 0 ? whole : `${whole}.${cut}`;
}

export function parseAmount(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{0,6})?$/.test(trimmed)) throw new Error("Invalid tUSD8 amount (max 6 decimals)");
  return parseUnits(trimmed, TUSD8_DECIMALS);
}

export function percent(spent: bigint, cap: bigint): number {
  if (cap === 0n) return 0;
  return Math.min(100, Number((spent * 10000n) / cap) / 100);
}

export function invoiceTuple(invoice: Invoice) {
  return [
    invoice.programmeId,
    invoice.invoiceId,
    invoice.teamId,
    invoice.categoryId,
    invoice.supplier,
    invoice.token,
    invoice.amount,
    invoice.evidenceHash,
    invoice.nonce,
    invoice.deadline,
  ] as const;
}

/* ------------------------------------------------------------------ */
/* Custom-error → plain language                                       */
/* ------------------------------------------------------------------ */

const ERROR_TEXT: Record<string, string> = {
  NotSponsor: "Only the programme sponsor can perform this action.",
  ProgrammeNotActive: "The programme is paused or closed, so no payments can be made.",
  ProgrammeNotStarted: "The programme has not started yet.",
  ProgrammeExpired: "The programme has expired. Payments are no longer permitted.",
  InvoiceExpired: "This invoice has expired and can no longer be paid.",
  UnauthorisedAgent: "This wallet has no procurement mandate for this programme.",
  AgentNotActive: "This agent mandate has been revoked.",
  AgentExpired: "This agent mandate has expired.",
  AgentScopeMismatch: "This agent is not authorised for this field team and expense category.",
  PerInvoiceCapExceeded: "The invoice amount exceeds this agent's maximum per invoice.",
  AgentCumulativeCapExceeded: "The invoice would exceed this agent's total lifetime allowance.",
  SupplierNotApproved: "This supplier is not approved for the selected expense category.",
  SupplierMismatch: "The invoice payee does not match the registered supplier.",
  WrongProgramme: "The invoice does not belong to this programme.",
  WrongToken: "The invoice token is not the programme's tUSD8 token.",
  InvalidSupplierSignature: "The supplier signature does not match the registered supplier wallet.",
  AmountZero: "The invoice amount must be greater than zero.",
  InvoiceAlreadyUsed: "This invoice ID has already been paid and cannot be reused.",
  NonceAlreadyUsed: "This supplier nonce has already been used. A fresh nonce is required.",
  CategoryBudgetExceeded: "The expense category does not have enough remaining budget.",
  TeamBudgetExceeded: "The field team does not have enough remaining allocation for this category.",
  ProgrammeBudgetExceeded: "The programme does not have enough remaining funded balance.",
  InsufficientTokenBalance: "The programme vault does not hold enough tUSD8 to make this payment.",
  CategoryUnknown: "This expense category has not been configured.",
  TeamUnknown: "This field team has not been registered.",
  InvalidCap: "The proposed cap is invalid or would reduce a committed allocation.",
  InvalidAddress: "One of the addresses is invalid.",
  InvalidTimeWindow: "The programme or mandate time window is invalid.",
  UnsafeReconfiguration: "A category or allocation with spending history cannot be reduced.",
  AlreadyClosed: "This programme is already closed.",
  NothingToRefund: "There are no unspent funds to refund.",
  DuplicateProgramme: "A programme with this ID already exists.",
  InvalidProgrammeId: "A programme ID is required.",
};

export const errorSelectors: Record<string, string> = Object.fromEntries(
  Object.keys(ERROR_TEXT).map((name) => [toFunctionSelector(`error ${name}()`), name]),
);

export function explainError(error: unknown): { code: string; message: string } {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error ?? {});

  for (const [selector, name] of Object.entries(errorSelectors)) {
    if (text.toLowerCase().includes(selector.toLowerCase())) {
      return { code: name, message: ERROR_TEXT[name] };
    }
  }
  for (const [name, message] of Object.entries(ERROR_TEXT)) {
    if (text.includes(name)) return { code: name, message };
  }
  // viem often surfaces revert reason strings directly.
  const reason = text.match(/reverted with reason string ['"]([^'"]+)['"]/i)?.[1];
  return { code: "Unknown", message: reason ?? "The transaction was rejected. Check the wallet or RPC error for details." };
}
