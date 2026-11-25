# Demo script (3:45 target)

> If live deployment is unavailable, run the fork test and label every screen
> "local fork simulation". Never present simulated state as a settled Aevum
> transaction.

| Time | Narration | On screen |
| --- | --- | --- |
| 0:00–0:25 | Restricted programme budgets are usually controlled with separate caps, spreadsheets and after-the-fact reconciliation. A spending-limit wallet cannot answer whether a payment matched the programme's purpose. | Landing page: value proposition and allocation rail. |
| 0:25–0:55 | FIELDRAIL partitions one vault into category envelopes and field-team allocations, approves suppliers per category, and delegates a scoped agent that can only submit signed invoices. | `/programme` budget and team envelopes. |
| 0:55–1:45 | Sponsor funds the programme; supplier signs an EIP-712 invoice; agent submits `payInvoice`; the contract verifies every gate and transfers tUSD8. | `/operations` → success result + explorer receipt. |
| 1:45–2:25 | Now try an unapproved vendor, an exhausted envelope and a replayed nonce. The UI explains the exact reason and the call is denied by the contract (eth_call simulation labelled as such). | `/operations#blocked`. |
| 2:25–3:05 | The audit ledger shows team, category, supplier, agent, evidence hash and receipt. The mandate console shows caps and immediate revocation. | `/audit` and `/agents`. |
| 3:05–3:45 | Platform integration, why this is more than a checkout, and the business path. Show real addresses/hashes if deployed; otherwise state the fork-verification status plainly. | `/settings` diagnostics. |

## Demo data

Programme: Northern Water Access — Field Operations Demo (synthetic).
Funding 1,000 tUSD8; Water 450, Transport 250, Supplies 200, reserve 100.
Teams: North Zone, South Zone. Suppliers are synthetic labels. No personal data.

## Fallback plan

If the RPC is unavailable: run `forge test --match-contract ForkJourneyTest --fork-url ... -vvv` from a machine with network, capture the trace, and present it with a clear "fork simulation" label. The web app falls back to labelled synthetic data and never invents a transaction hash.
