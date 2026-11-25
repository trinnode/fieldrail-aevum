import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "pnpm",
  args: ["--filter", "@fieldrail/mcp-server", "dev"],
  cwd: process.cwd(),
  stderr: "pipe",
});

const client = new Client({ name: "fieldrail-smoke", version: "1.0.0" });
await client.connect(transport);

try {
  const tools = await client.listTools();
  console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

  const parsed = await client.callTool({
    name: "fieldrail_draft_payment_intent",
    arguments: {
      request: "Pay 18 tUSD8 to 0x1111111111111111111111111111111111111111 for water in North Zone, invoice INV-42 nonce 7",
    },
  });
  console.log("PARSE:", parsed.content[0].text.slice(0, 700));

  const budget = await client.callTool({ name: "fieldrail_get_programme_budget", arguments: {} });
  console.log("BUDGET:", budget.content[0].text.slice(0, 500));

  const blocked = await client.callTool({
    name: "fieldrail_submit_payment",
    arguments: {
      programmeId: "0x" + "00".repeat(32),
      invoiceId: "0x" + "01".repeat(32),
      teamId: "0x" + "02".repeat(32),
      categoryId: "0x" + "03".repeat(32),
      supplier: "0x1111111111111111111111111111111111111111",
      token: "0x456569838f1d43009A91ebA4263147Afd7233483",
      amount: "18000000",
      evidenceHash: "0x" + "04".repeat(32),
      nonce: "1",
      deadline: "2000000000",
      signature: "0x" + "00".repeat(65),
    },
  });
  console.log("WRITE_GUARD:", blocked.isError === true ? "blocked as expected" : "UNEXPECTED SUCCESS");
} finally {
  await client.close();
}
