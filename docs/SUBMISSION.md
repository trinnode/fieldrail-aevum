# Submission text and checklist

## Copy-ready summary

FIELDRAIL is the programmable disbursement rail for field programmes. A sponsor funds a programme vault with tUSD8, partitions it into expense-category and field-team envelopes, approves suppliers per category, and delegates a narrowly scoped procurement agent. The agent has no arbitrary transfer path; it can only submit a supplier-signed EIP-712 invoice that binds programme, team, category, amount, payee, nonce, evidence hash and deadline. Every nested budget, mandate cap, approval and replay guard is enforced by the contract before the token moves.

The differentiator is the nested purpose-bound envelope hierarchy with envelope-level rejection reasons and a constrained agent execution path — not a generic wallet limit, checkout or x402 gateway.

## Evidence to attach

- Public repo: `https://github.com/trinnode/fieldrail-aevum`
- `docs/DEPLOYMENTS.md` — chain/token facts and honest deployment status
- `docs/TEST_RESULTS.md` — 44 local tests plus fork verification
- `docs/THREAT_MODEL.md` — mitigations and residual risk
- Demo video (3:45) and `DEMO_SCRIPT.md`

## Checklist — honest status

| Requirement | Status |
| --- | --- |
| Public source repository | Done |
| Working live application or Docker package | Source runs locally; no public host deployed (no deployment credential) |
| Smart contracts deployed on Aevum Testnet | Not done — funded deployer unavailable |
| Verified tUSD8 integration and actual payment | Verified on live-state Shanghai fork; live tx not possible without faucet |
| At least one actual success transaction hash | Not available; fork simulation has no hash |
| Evidence of a policy rejection | Unit and fork tests show `InvoiceAlreadyUsed` and 40+ policy revert cases |
| Explorer links and source verification status | Explorer links configured; nothing deployed to verify |
| README and architecture diagram | Done |
| Security / threat model | Done |
| Environment variable specification | Done |
| Reproduction instructions | Done |
| Demo video within requested duration | Script ready; recording not captured in this session |
| DoraHacks submission text and links | Draft text above; final submission requires live deployment evidence |

## Go / no-go

**No-go for the "live on-chain payment" judging criterion until a funded testnet wallet is supplied.** All other build criteria are implemented and tested locally. This document deliberately does not claim a live transaction that did not happen.
