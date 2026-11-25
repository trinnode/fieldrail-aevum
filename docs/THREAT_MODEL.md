# Threat model

## Assets

- Unspent tUSD8 held in a programme vault.
- Sponsor administrative authority.
- Supplier signing keys and the integrity of quotes/evidence hashes.
- Agent mandate authority and its per-invoice / lifetime allowances.
- Audit trail (`InvoicePaid` events) and the UI's representation of settlement.

## Adversaries and mitigations

| Threat | Mitigation implemented |
| --- | --- |
| Compromised agent sends funds anywhere | The agent has no arbitrary transfer function. `payInvoice` requires a registered supplier, a category-scoped mandate and a valid supplier signature. |
| Agent raises its own cap or scope | No function lets a non-sponsor mutate `mandates`. `authoriseAgent` and `revokeAgent` are sponsor-only. |
| Supplier key compromise | Sponsor can call `revokeSupplier(supplier, category)` immediately; revoked suppliers are checked on every payment. |
| Category substitution by a supplier | The signed invoice includes `categoryId`; the mandate, supplier registry and budget checks all use the same category. |
| Amount / payee / nonce substitution | All fields are in the signed digest; invoice ID and `(supplier, nonce)` are consumed on first use and re-checked. |
| Replay across vaults or chains | EIP-712 domain includes chain ID and `verifyingContract`; a signature for one vault fails on another. |
| Front-running / duplicate submissions | `nonReentrant`, consumed invoice ID and nonce, plus checks-effects-interactions ordering. |
| Sponsor key compromise | Sponsor power is intentionally broad. Mitigation is operational: sponsor key must be separate from the agent key and from the deployer key; documented in `SECURITY.md`. |
| Reentrancy / malicious token | `ReentrancyGuard`, `SafeERC20`, balance-delta funding, effects before external transfer. |
| Decimal / integer mistakes | All amounts are `bigint` / `uint256` base units; token decimals are read on-chain and asserted as 6 in diagnostics. |
| Stale or tampered evidence | Only the evidence **hash** is signed and emitted. Evidence text is untrusted and never used as an authorisation input. |
| UI shows a payment before confirmation | Writes await `waitForTransactionReceipt`; demo mode is labelled and cannot show a fake hash. |
| Prompt injection in invoice metadata | The deterministic parser never executes instructions; instruction-like phrases generate a warning. The contract cannot be influenced by model output. |
| RPC outage / log pagination | 900-block paginated log queries; a failed RPC falls back to clearly labelled synthetic data with an error banner. |
| Expiry and refund races | Expiry is immutable; `closeProgramme` is irreversible; `refundUnspent` requires `Closed` and computes `totalFunded - totalSpent - refunded` exactly once. |
| Pause used to confiscate funds | `pauseProgramme` only changes status. It cannot move tokens, change caps or redirect a refund. |

## Residual risk

- Sponsor key compromise remains the largest single risk; no contract-level mitigation can fully remove it.
- The local library shims are not a formally audited dependency set. Replace with pinned upstream releases before real-value use.
- The synthetic demo mode is deliberately not a substitute for on-chain verification.
- No KYC, sanctions screening, legal compliance or accounting attestation is provided.
