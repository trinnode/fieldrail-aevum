# FIELDRAIL

**Purpose in every payment.**

FIELDRAIL is a purpose-bound stablecoin disbursement rail for field programmes. A sponsor funds one programme vault with tUSD8, partitions it into expense-category envelopes and field-team allocations, approves suppliers per category, and delegates a narrowly scoped procurement agent. The agent has exactly one payment path: `payInvoice`, which succeeds only when a supplier-signed EIP-712 invoice satisfies every nested policy at once.

This is a QDay Aevum Builder Challenge #1 prototype. All programmes, vendors, teams and balances are **synthetic test data**. Nothing here is a real grant, audit, legal compliance statement or production payment system.

## The mechanism

`Funder → Programme Vault → Expense Category → Field Team → Approved Supplier → Signed Invoice → tUSD8 Payment`

A payment is rejected unless the programme is active and unexpired; the agent is authorised, unrevoked, unexpired and scoped to the stated team and category; the supplier is approved for that category; the signature binds the exact invoice to this vault and chain; the invoice ID and supplier nonce are unused; and programme, category and team/category budgets all have room. There is no arbitrary `transfer` method for agents.

## What is implemented

| Area | Status |
| --- | --- |
| Solidity contracts (factory, vault, EIP-712 invoice) | Implemented |
| Unit, fuzz and invariant-equivalent fuzz tests (44 tests) | Tested locally — all pass |
| Real tUSD8 payment on a Shanghai fork of live Aevum state | Verified on fork |
| Live Aevum deployment and on-chain tUSD8 transaction | **Blocked** — see `docs/DEPLOYMENTS.md` |
| Next.js application with all required screens | Implemented; production build passes |
| MCP server with 11 tools and deterministic no-key parser | Implemented; smoke-tested over stdio |
| ERC-4337 / paymaster integration | Not claimed — see `docs/API.md` |

## Quickstart

```bash
pnpm install
cp .env.example .env.local       # fill only public values you have verified
pnpm --filter @fieldrail/web dev # http://localhost:3000
```

Contracts:

```bash
cd contracts
forge build
forge test -vvv
forge fmt --check
```

A real-token fork run (requires network access to the Aevum RPC):

```bash
cd contracts
forge test --match-contract ForkJourneyTest --fork-url https://rpc-test.qday.info -vvv
```

MCP server:

```bash
pnpm --filter @fieldrail/mcp-server dev
node scripts/mcp-smoke.mjs
```

Without a configured vault address the web app runs in **explicitly labelled synthetic demo mode**. It never presents simulated balances as on-chain state.

## Repository map

- `contracts/` — Foundry contracts, tests and deploy scripts
- `apps/web/` — Next.js App Router application
- `apps/mcp-server/` — Model Context Protocol server
- `packages/` — chain config, shared types, contracts client (ABIs, error mapping, money helpers)
- `docs/` — architecture, threat model, security, runbook, API, deployments, demo and submission
- `research/` — dated competitive landscape and source registry
- `public/brand/` — original SVG identity; `apps/web/public/fonts/` — self-hosted WOFF2 files

## Licence and attribution

MIT. See `LICENSE`. Fonts are SIL OFL 1.1 (`apps/web/public/fonts/LICENSES.md`). Local library shims are documented in `docs/TEST_RESULTS.md`. No paid UI blocks, domains or hosted infrastructure were purchased.

## Honest boundaries

- This is a testnet prototype, not production-ready for donor funds.
- Static analysis and tests are not a formal third-party audit.
- ECDSA accounts on Aevum are not advertised as post-quantum secure.
- The AI/MCP layer can explain and prepare; the contract is the authority.
