# API

## Contract read functions

`FieldrailProgramVault`: `sponsor()`, `paymentToken()`, `programmeId()`, `programmeMetadataHash()`, `startAt()`, `expiresAt()`, `status()`, `totalFunded()`, `totalSpent()`, `refunded()`, `closedAt()`, `categoryCap(bytes32)`, `categorySpent(bytes32)`, `teamCategoryCap(bytes32,bytes32)`, `teamCategorySpent(bytes32,bytes32)`, `suppliers(address,bytes32)`, `mandates(address)`, `consumedInvoiceIds(bytes32)`, `consumedNonces(address,uint256)`, `getCategoryRemaining(bytes32)`, `getTeamCategoryRemaining(bytes32,bytes32)`, `getFundsRemaining()`, `getAgentRemaining(address)`, `isSupplierApproved(address,bytes32)`, `isInvoiceConsumed(bytes32)`, `isNonceConsumed(address,uint256)`, `hashInvoice(Invoice)`, `eip712Domain()`.

`FieldrailFactory`: `vaultOfProgramme(bytes32)`, `getProgrammes()`, `programmeCount()`.

## Contract write functions

Sponsor-only: `fund`, `configureCategory`, `registerTeam`, `allocateTeam`, `registerSupplier`, `revokeSupplier`, `authoriseAgent`, `revokeAgent`, `pauseProgramme`, `resumeProgramme`, `closeProgramme`, `refundUnspent`.

Agent-only in practice: `payInvoice(Invoice, bytes)` — the sole ordinary payment path. There is no arbitrary transfer method.

## Events

`ProgramCreated`, `ProgramFunded`, `CategoryConfigured`, `TeamRegistered`, `TeamAllocationConfigured`, `SupplierRegistered`, `SupplierRevoked`, `AgentAuthorised`, `AgentRevoked`, `InvoicePaid`, `ProgrammePaused`, `ProgrammeResumed`, `ProgrammeClosed`, `Refunded`.

## TypeScript example

```ts
import { publicClient } from "./client";
import { vaultAbi, invoiceMessage, parseAmount } from "@fieldrail/contracts-client";

const invoice = {
  programmeId: bytes32("NORTHERN_WATER_ACCESS_DEMO"),
  invoiceId: bytes32("INV-001"),
  teamId: bytes32("NORTH_ZONE"),
  categoryId: bytes32("WATER_PROCUREMENT"),
  supplier: supplierAddress,
  token: TUSD8_ADDRESS,
  amount: parseAmount("18"),
  evidenceHash: bytes32("borehole-07-quote"),
  nonce: 1n,
  deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
};

const signature = await walletClient.signTypedData({
  account: supplierAddress,
  domain: {
    name: "FieldrailProgramVault",
    version: "1",
    chainId: 44005,
    verifyingContract: vaultAddress,
  },
  types: invoiceTypes,
  primaryType: "Invoice",
  message: invoiceMessage(invoice),
});

const hash = await walletClient.writeContract({
  address: vaultAddress,
  abi: vaultAbi,
  functionName: "payInvoice",
  args: [invoiceMessage(invoice), signature],
  account: agentAddress,
});
await publicClient.waitForTransactionReceipt({ hash });
```

## MCP tools

Read-only: `fieldrail_list_programmes`, `fieldrail_get_programme_budget`, `fieldrail_get_team_allocation`, `fieldrail_get_category_balance`, `fieldrail_get_supplier`, `fieldrail_get_invoice_status`, `fieldrail_get_payment_receipt`.

Preparation: `fieldrail_validate_invoice`, `fieldrail_draft_payment_intent`, `fieldrail_simulate_payment`.

Write (opt-in): `fieldrail_submit_payment`. It requires `ALLOW_AGENT_SUBMIT=true` and `AGENT_SESSION_PRIVATE_KEY` deriving to the configured agent address. There is no tool that can call arbitrary contract methods with arbitrary calldata.

## ERC-4337 / paymaster status

Not integrated, and not claimed. Research on 2026-11-25 found no published EntryPoint address, bundler endpoint, deployed paymaster policy or verified `@qday-io/sdk` surface on Aevum. `research/QDAY_PLATFORM.md` records the evidence. FIELDRAIL therefore uses its own on-chain agent mandate and ordinary wallet transactions. Do not describe this as QDay native session keys.
