# Deployments and live verification

## Network facts verified on 2026-11-25

| Item | Value | Verification |
| --- | --- | --- |
| Chain | QDay Aevum Testnet | `eth_chainId` → `0xabe5` |
| Chain ID | `44005` | Same call |
| RPC | `https://rpc-test.qday.info` | Live JSON-RPC responses |
| Explorer | `https://explorer-test.qday.info` | Official docs/challenge page |
| Gas token | tQDAY (18 decimals) | Official wiki |
| tUSD8 | `0x456569838f1d43009A91ebA4263147Afd7233483` | `eth_getCode` non-empty; `decimals()` → 6; `symbol()` → tUSD8 |
| tUSD8 EIP-712 domain | name `tUSD8`, version `2` | Documented in starter kit; not used by FIELDRAIL's own invoice domain |

## Contract deployments

| Contract | Address | Status |
| --- | --- | --- |
| `FieldrailFactory` | — | **Not deployed to live Aevum** |
| `FieldrailProgramVault` (demo) | — | **Not deployed to live Aevum** |

### Exact blocker

The autonomous build host has no funded Aevum wallet. The challenge faucet
(`https://faucet.qday.info/en`) and in-widget faucet require an interactive
wallet connection and on-chain claim; the Discord faucet requires an
authenticated Discord account running `/faucet`. No sponsor/admin/deployer key
was provided, and the brief forbids inventing addresses, hashes or funding.
Deploying without gas and tUSD8 is therefore impossible in this session.

Required user action to finish live deployment: provide a dedicated, funded
Aevum testnet deployer key and a supplier/agent test key, or complete the
faucet claim for a generated throwaway address. No secrets should be pasted
into the repository; set them as environment variables only.

## What was verified instead

A real-token execution against live Aevum state on a local Shanghai fork:

```bash
cd contracts
forge test --match-contract ForkJourneyTest --fork-url https://rpc-test.qday.info -vvv
# [PASS] testRealTUSD8JourneyOnAevumFork()
```

The trace shows:

- live tUSD8 bytecode present and `decimals()` returning 6;
- 20.00 tUSD8 moved from a discovered live holder onto a throwaway sponsor;
- factory + vault deployed, funded, configured with a category/team/supplier/agent;
- supplier `ECDSA.recover` succeeded for the signed invoice;
- `InvoicePaid` emitted, then a real ERC-20 `Transfer` of 1.00 tUSD8 to the supplier;
- replay of the same invoice reverted with `InvoiceAlreadyUsed`.

This is a **fork simulation**, not a live testnet transaction. There is no live
transaction hash to report.

## Source verification

Not applicable — no live contracts were deployed, so nothing was submitted to
the explorer verifier. Contract verification steps are documented in the
starter-kit notes and in `RUNBOOK.md` for when a funded deployer is available.
