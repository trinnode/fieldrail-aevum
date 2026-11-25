import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import {
  TUSD8_ADDRESS,
  DEMO_AGENT_ADDRESS,
  aevumChain,
  isConfigured,
  DEMO_VAULT_ADDRESS,
} from "@fieldrail/chain-config";
import { vaultAbi, invoiceMessage } from "@fieldrail/contracts-client";
import { bytes32 } from "@fieldrail/shared-types";

const PROGRAMME_ID = bytes32("NORTHERN_WATER_ACCESS_DEMO");
import {
  chain,
  client,
  result,
  listProgrammes,
  programmeBudget,
  categoryBalance,
  teamAllocation,
  supplierRecord,
  invoiceStatus,
  paymentReceipt,
  validateInvoiceInput,
  simulateInvoice,
  toInvoice,
  type InvoiceInput,
} from "./fieldrail.js";
import { fillDefaults, parseProcurementRequest } from "./parser.js";

const server = new McpServer(
  { name: "fieldrail", version: "0.1.0" },
  { instructions: "FIELDRAIL procurement assistant. Read-only by default. All contract state is authoritative; this server never exposes sponsor keys." },
);

const hex = z.string().regex(/^0x[a-fA-F0-9]+$/);
const invoiceShape = {
  programmeId: hex,
  invoiceId: hex,
  teamId: hex,
  categoryId: hex,
  supplier: hex,
  token: hex,
  amount: z.string().regex(/^\d+$/),
  evidenceHash: hex,
  nonce: z.string().regex(/^\d+$/),
  deadline: z.string().regex(/^\d+$/),
};

const guard = async (fn: () => Promise<unknown>) => {
  try {
    return result(await fn());
  } catch (e) {
    return result({ error: e instanceof Error ? e.message : String(e) }, true);
  }
};

server.registerTool("fieldrail_list_programmes", { description: "List programmes discovered from the factory, or the labelled demo programme." }, () => guard(listProgrammes));

server.registerTool("fieldrail_get_programme_budget", { description: "Read funded, spent and remaining tUSD8 for a programme." }, () => guard(programmeBudget));

server.registerTool(
  "fieldrail_get_team_allocation",
  { description: "Read a field team's cap, spend and remaining balance for a category.", inputSchema: { teamId: hex, categoryId: hex } },
  ({ teamId, categoryId }) => guard(() => teamAllocation(teamId as `0x${string}`, categoryId as `0x${string}`)),
);

server.registerTool(
  "fieldrail_get_category_balance",
  { description: "Read an expense category envelope.", inputSchema: { categoryId: hex } },
  ({ categoryId }) => guard(() => categoryBalance(categoryId as `0x${string}`)),
);

server.registerTool(
  "fieldrail_get_supplier",
  { description: "Check whether a wallet is an active supplier for a category.", inputSchema: { supplier: hex, categoryId: hex } },
  ({ supplier, categoryId }) => guard(() => supplierRecord(supplier as `0x${string}`, categoryId as `0x${string}`)),
);

server.registerTool(
  "fieldrail_get_invoice_status",
  { description: "Check whether an invoice ID has been consumed.", inputSchema: { invoiceId: hex } },
  ({ invoiceId }) => guard(() => invoiceStatus(invoiceId as `0x${string}`)),
);

server.registerTool(
  "fieldrail_get_payment_receipt",
  { description: "Read a transaction receipt and return its explorer link.", inputSchema: { hash: hex } },
  ({ hash }) => guard(() => paymentReceipt(hash as `0x${string}`)),
);

server.registerTool(
  "fieldrail_validate_invoice",
  {
    description: "Deterministic policy preflight against current on-chain state. No model output is trusted.",
    inputSchema: invoiceShape,
  },
  (input) => guard(() => validateInvoiceInput(input as InvoiceInput)),
);

server.registerTool(
  "fieldrail_draft_payment_intent",
  {
    description: "Parse a natural-language procurement request into a structured invoice draft using deterministic rules. Ambiguity stops for human review.",
    inputSchema: { request: z.string().min(3) },
  },
  ({ request }) => {
    const parsed = parseProcurementRequest(request);
    const deadline = (BigInt(Math.floor(Date.now() / 1000)) + 86_400n).toString();
    const full = parsed.ok && parsed.draft
      ? fillDefaults(parsed.draft, PROGRAMME_ID, TUSD8_ADDRESS, BigInt(deadline))
      : null;
    return result({
      ...parsed,
      draft: full,
      note: "Draft only. Eligibility is determined by fieldrail_validate_invoice and the contract.",
    });
  },
);

server.registerTool(
  "fieldrail_simulate_payment",
  {
    description: "Simulate the exact payInvoice call with eth_call. Does not submit a transaction.",
    inputSchema: { ...invoiceShape, signature: hex },
  },
  ({ signature, ...input }) => guard(() => simulateInvoice(input as InvoiceInput, signature as `0x${string}`)),
);

server.registerTool(
  "fieldrail_submit_payment",
  {
    description: "Submit payInvoice using the configured scoped agent signer. Disabled unless ALLOW_AGENT_SUBMIT=true and the key belongs to the agent wallet. Never uses a sponsor key.",
    inputSchema: { ...invoiceShape, signature: hex },
  },
  async ({ signature, ...raw }) => {
    const key = process.env.AGENT_SESSION_PRIVATE_KEY;
    const allowed = process.env.ALLOW_AGENT_SUBMIT === "true";
    if (!allowed || !key) {
      return result({ ok: false, reason: "Agent submission is disabled. Set ALLOW_AGENT_SUBMIT=true and a scoped AGENT_SESSION_PRIVATE_KEY." }, true);
    }
    try {
      const account = privateKeyToAccount(key as Hex);
      if (account.address.toLowerCase() !== DEMO_AGENT_ADDRESS.toLowerCase()) {
        return result({ ok: false, reason: "Configured key is not the scoped agent wallet. Refusing to sign." }, true);
      }
      if (!isConfigured(DEMO_VAULT_ADDRESS)) {
        return result({ ok: false, reason: "No programme vault configured." }, true);
      }
      const input = raw as InvoiceInput;
      const validation = await validateInvoiceInput(input);
      if (!validation.allowed) return result({ ok: false, reason: validation.reason, checks: validation.checks }, true);
      const simulation = await simulateInvoice(input, signature as `0x${string}`);
      if (!simulation.allowed) return result({ ok: false, reason: simulation.message ?? "Simulation failed" }, true);

      const wallet = createWalletClient({ account, chain, transport: http(aevumChain.rpcUrl) });
      const invoice = toInvoice(input);
      const hash = await wallet.writeContract({
        address: DEMO_VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "payInvoice",
        args: [invoiceMessage(invoice), signature as `0x${string}`],
        account,
      });
      const receipt = await client().waitForTransactionReceipt({ hash });
      return result({ ok: receipt.status === "success", hash, status: receipt.status, blockNumber: receipt.blockNumber.toString() });
    } catch (e) {
      return result({ ok: false, error: e instanceof Error ? e.message : String(e) }, true);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("FIELDRAIL MCP server ready (stdio)\n");
}

void main();
