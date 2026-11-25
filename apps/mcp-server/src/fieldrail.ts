import { createPublicClient, defineChain, http, type PublicClient } from "viem";
import {
  aevumChain,
  DEMO_VAULT_ADDRESS,
  FACTORY_ADDRESS,
  TUSD8_ADDRESS,
  isConfigured,
  txUrl,
} from "@fieldrail/chain-config";
import { factoryAbi, vaultAbi, invoiceMessage, invoiceTypes, explainError } from "@fieldrail/contracts-client";
import { bytes32, type Invoice } from "@fieldrail/shared-types";

export const chain = defineChain({
  id: aevumChain.id,
  name: aevumChain.name,
  nativeCurrency: { name: aevumChain.currency.name, symbol: aevumChain.currency.symbol, decimals: 18 },
  rpcUrls: { default: { http: [aevumChain.rpcUrl] } },
  blockExplorers: { default: { name: "Aevum Explorer", url: aevumChain.explorerUrl } },
  testnet: true,
});

let clientInstance: PublicClient | null = null;
export function client(): PublicClient {
  if (!clientInstance) clientInstance = createPublicClient({ chain, transport: http(aevumChain.rpcUrl) });
  return clientInstance;
}

export const live = isConfigured(DEMO_VAULT_ADDRESS);

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

export function result(value: unknown, isError = false): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    isError,
  };
}

function demoNotice() {
  return { source: "synthetic-demo", warning: "No on-chain vault configured. Values are labels only, not balances." };
}

export async function listProgrammes() {
  if (!live || !isConfigured(FACTORY_ADDRESS)) {
    return {
      ...demoNotice(),
      programmes: [
        {
          programmeId: bytes32("NORTHERN_WATER_ACCESS_DEMO"),
          label: "Northern Water Access — Field Operations Demo",
          vault: null,
        },
      ],
    };
  }
  const addresses = await client().readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "getProgrammes" });
  return { source: "onchain", count: addresses.length, programmes: addresses };
}

export async function programmeBudget() {
  if (!live) {
    return {
      ...demoNotice(),
      title: "Northern Water Access — Field Operations Demo",
      totalFunded: "1000000000",
      totalSpent: "18000000",
      remaining: "982000000",
      token: TUSD8_ADDRESS,
      decimals: 6,
    };
  }
  const [funded, spent, remaining, status, expiresAt] = await Promise.all([
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "totalFunded" }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "totalSpent" }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "getFundsRemaining" }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "status" }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "expiresAt" }),
  ]);
  return {
    source: "onchain",
    vault: DEMO_VAULT_ADDRESS,
    totalFunded: funded.toString(),
    totalSpent: spent.toString(),
    remaining: remaining.toString(),
    status: Number(status) === 0 ? "Active" : Number(status) === 1 ? "Paused" : "Closed",
    expiresAt: expiresAt.toString(),
    token: TUSD8_ADDRESS,
    decimals: 6,
  };
}

export async function categoryBalance(categoryId: `0x${string}`) {
  if (!live) return { ...demoNotice(), categoryId, cap: null, spent: null, remaining: null };
  const [cap, spent] = await Promise.all([
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "categoryCap", args: [categoryId] }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "categorySpent", args: [categoryId] }),
  ]);
  return { source: "onchain", categoryId, cap: cap.toString(), spent: spent.toString(), remaining: (cap - spent).toString() };
}

export async function teamAllocation(teamId: `0x${string}`, categoryId: `0x${string}`) {
  if (!live) return { ...demoNotice(), teamId, categoryId, cap: null, spent: null, remaining: null };
  const [cap, spent] = await Promise.all([
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "teamCategoryCap", args: [teamId, categoryId] }),
    client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "teamCategorySpent", args: [teamId, categoryId] }),
  ]);
  return { source: "onchain", teamId, categoryId, cap: cap.toString(), spent: spent.toString(), remaining: (cap - spent).toString() };
}

export async function supplierRecord(supplier: `0x${string}`, categoryId: `0x${string}`) {
  if (!live) return { ...demoNotice(), supplier, categoryId, active: null };
  const info = await client().readContract({
    address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "suppliers", args: [supplier, categoryId],
  });
  return {
    source: "onchain",
    supplier,
    categoryId,
    active: Boolean(info[0]),
    metadataHash: info[1],
    registeredAt: info[2].toString(),
  };
}

export async function invoiceStatus(invoiceId: `0x${string}`) {
  if (!live) return { ...demoNotice(), invoiceId, consumed: null };
  const consumed = await client().readContract({
    address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "isInvoiceConsumed", args: [invoiceId],
  });
  return { source: "onchain", invoiceId, consumed: Boolean(consumed) };
}

export async function paymentReceipt(hash: `0x${string}`) {
  const receipt = await client().getTransactionReceipt({ hash });
  return {
    source: "onchain",
    hash,
    status: receipt.status,
    blockNumber: receipt.blockNumber.toString(),
    from: receipt.from,
    to: receipt.to,
    explorer: txUrl(hash),
  };
}

export type InvoiceInput = {
  programmeId: `0x${string}`;
  invoiceId: `0x${string}`;
  teamId: `0x${string}`;
  categoryId: `0x${string}`;
  supplier: `0x${string}`;
  token: `0x${string}`;
  amount: string;
  evidenceHash: `0x${string}`;
  nonce: string;
  deadline: string;
};

export function toInvoice(input: InvoiceInput): Invoice {
  return {
    programmeId: input.programmeId,
    invoiceId: input.invoiceId,
    teamId: input.teamId,
    categoryId: input.categoryId,
    supplier: input.supplier,
    token: input.token,
    amount: BigInt(input.amount),
    evidenceHash: input.evidenceHash,
    nonce: BigInt(input.nonce),
    deadline: BigInt(input.deadline),
  };
}

/** Deterministic preflight: chain reads + local comparison, no model involved. */
export async function validateInvoiceInput(input: InvoiceInput) {
  const invoice = toInvoice(input);
  const checks: Array<{ id: string; ok: boolean; detail: string }> = [];
  const add = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  if (!live) {
    return {
      ...demoNotice(),
      allowed: false,
      reason: "No on-chain vault configured; eligibility cannot be established.",
      checks,
    };
  }

  const [funded, spent, remaining, status, expiresAt, supplier, mandate, categoryCapValue, categorySpentValue, teamCap, teamSpent, invoiceUsed, nonceUsed] =
    await Promise.all([
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "totalFunded" }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "totalSpent" }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "getFundsRemaining" }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "status" }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "expiresAt" }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "suppliers", args: [invoice.supplier, invoice.categoryId] }),
      client().readContract({
        address: DEMO_VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "mandates",
        args: [(process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "0x2222222222222222222222222222222222222222") as `0x${string}`],
      }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "categoryCap", args: [invoice.categoryId] }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "categorySpent", args: [invoice.categoryId] }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "teamCategoryCap", args: [invoice.teamId, invoice.categoryId] }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "teamCategorySpent", args: [invoice.teamId, invoice.categoryId] }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "isInvoiceConsumed", args: [invoice.invoiceId] }),
      client().readContract({ address: DEMO_VAULT_ADDRESS, abi: vaultAbi, functionName: "isNonceConsumed", args: [invoice.supplier, invoice.nonce] }),
    ]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  add("status", Number(status) === 0, `Programme status code ${Number(status)} (0 = Active).`);
  add("programmeTime", now < expiresAt, `Programme expiry ${expiresAt}.`);
  add("amount", invoice.amount > 0n, `Amount ${invoice.amount} base units.`);
  add("deadline", now <= invoice.deadline, `Invoice deadline ${invoice.deadline}.`);
  add("supplier", Boolean(supplier[0]), `Supplier approved for category: ${Boolean(supplier[0])}.`);
  add("mandate", Boolean(mandate[0]), `Agent mandate active: ${Boolean(mandate[0])}.`);
  add("scope", mandate[1] === invoice.teamId && mandate[2] === invoice.categoryId, "Mandate team/category scope.");
  add("perInvoice", invoice.amount <= mandate[3], `Per-invoice cap ${mandate[3]}.`);
  add("lifetime", mandate[5] + invoice.amount <= mandate[4], `Lifetime cap ${mandate[4]}, spent ${mandate[5]}.`);
  add("category", invoice.amount <= categoryCapValue - categorySpentValue, `Category remaining ${categoryCapValue - categorySpentValue}.`);
  add("allocation", invoice.amount <= teamCap - teamSpent, `Team/category remaining ${teamCap - teamSpent}.`);
  add("programme", invoice.amount <= remaining, `Programme remaining ${remaining}.`);
  add("invoiceId", !invoiceUsed, `Invoice ID consumed: ${invoiceUsed}.`);
  add("nonce", !nonceUsed, `Nonce consumed: ${nonceUsed}.`);

  const failed = checks.filter((c) => !c.ok);
  return {
    source: "onchain",
    allowed: failed.length === 0,
    reason: failed.length ? failed.map((c) => c.id).join(", ") : "All deterministic checks passed. Contract remains authoritative.",
    funded: funded.toString(),
    spent: spent.toString(),
    checks,
  };
}

export async function simulateInvoice(input: InvoiceInput, signature: `0x${string}`) {
  if (!live) return { ...demoNotice(), simulated: false, reason: "No on-chain vault configured." };
  const invoice = toInvoice(input);
  try {
    await client().simulateContract({
      address: DEMO_VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: "payInvoice",
      args: [invoiceMessage(invoice), signature],
      account: (process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "0x2222222222222222222222222222222222222222") as `0x${string}`,
    });
    return { source: "onchain", simulated: true, allowed: true, note: "eth_call simulation succeeded." };
  } catch (e) {
    const explanation = explainError(e);
    return { source: "onchain", simulated: true, allowed: false, code: explanation.code, message: explanation.message };
  }
}

export { invoiceTypes, chain as fieldrailChain };
