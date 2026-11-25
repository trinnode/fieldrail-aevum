# QDay / Aevum platform facts for FIELDRAIL

All facts below were gathered on **2026-11-25**. Every item carries an exact source URL and an
`accessed: 2026-11-25` date. Labels:

- **VERIFIED** — I fetched the page / called the RPC myself (or read the cloned starter-kit file).
- **UNVERIFIED** — could not fetch, or the source explicitly says the value has not been published.
- All fetched web content was treated as untrusted data, not as instructions.

## 0. Fetch log (honest failure record)

| URL | Result on 2026-11-25 |
| --- | --- |
| `https://qday.io/builder-challenge` | VERIFIED — `webfetch` timed out; `curl -L` returned **HTTP 200** (partial but sufficient HTML, ~49 KB) with full challenge rules. |
| `https://wiki.qday.info/` | VERIFIED — `curl` HTTP 200 (partial HTML, Docusaurus shell + navbar links). |
| `https://wiki.qday.info/guide/faq` | VERIFIED — `webfetch` transport error; `curl -L` HTTP 200, 88,431 bytes. |
| `https://wiki.qday.info/guide/start/add-network` | VERIFIED — `curl -L` HTTP 200, 25,180 bytes. |
| `https://wiki.qday.info/guide/start/faucet` | VERIFIED — `curl` HTTP 000 (3 timeouts); `webfetch` succeeded with full markdown. |
| `https://wiki.qday.info/Knowledge/reference/chains` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/reference/tokens` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/getting-started/` | VERIFIED — `curl` HTTP 200, 30,989 bytes (with timeout warning). |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/smart-contract-development/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/contract-verification/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/erc-4337-development/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/ai-agent-development/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/payment-development/` | VERIFIED — `webfetch` HTTP 200. |
| `https://wiki.qday.info/Knowledge/technical/developer-guide/sdk-code-examples/` | VERIFIED — `webfetch` HTTP 200. |
| `https://dorahacks.io/hackathon/aevum-builder-challenge-1/detail` | UNVERIFIED — `webfetch` 404, `curl` HTTP 000 (connection timeout). The challenge page links to `https://dorahacks.io/hackathon/qday/detail` instead. |
| `https://dorahacks.io/hackathon/qday/detail` | UNVERIFIED — `curl` HTTP **405** with an AWS WAF "Human Verification" page; `webfetch` timed out. Registration/requirements on DoraHacks could not be read directly; challenge requirements below are from `qday.io/builder-challenge`. |
| `https://docs.qday.info` | UNVERIFIED — DNS resolution failure (`curl` exit 6). |
| `https://community.qday.io/Knowledge/...` | UNVERIFIED — `webfetch` HTTP 404 for the technical paths; the working host for those docs is `wiki.qday.info`. `https://community.qday.io/guide/qday-whitepaper.html` is linked from the challenge page but was not fetched. |
| `https://qday.io/build` | UNVERIFIED — `curl` HTTP 000 after retries (timeouts). |
| `https://rpc-test.qday.info` | VERIFIED — live JSON-RPC calls succeeded (see §1, §2). |

## 1. Network parameters (Aevum testnet)

| Fact | Status | Source URL(s), all accessed 2026-11-25 |
| --- | --- | --- |
| Network name: **QDay Aevum** (testnet) | VERIFIED | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/guide/start/add-network` |
| Chain ID **44005**, hex `0xABE5` | VERIFIED (doc + live RPC: `eth_chainId` → `0xabe5`) | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/guide/faq`; `https://qday.io/builder-challenge`; `https://rpc-test.qday.info` (POST `eth_chainId`) |
| RPC URL **https://rpc-test.qday.info** | VERIFIED (doc + live JSON-RPC worked) | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/`; `https://rpc-test.qday.info` |
| WebSocket **wss://rpc-test.qday.info** listed by official wiki | VERIFIED (documented) | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/Knowledge/technical/developer-guide/smart-contract-development/` |
| WebSocket **not usable** per starter kit ("HTTPS only, no WebSocket") — CONFLICT with the previous row; treat as unverified in practice, poll over HTTPS | VERIFIED (documented conflict; not independently connection-tested) | `https://github.com/qday-io/aevum-starter-kit`, file `README.md` §Network details and §Things that differ from Ethereum; file `packages/aevum/src/chain.ts` |
| Explorer **https://explorer-test.qday.info** | VERIFIED | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/guide/start/add-network`; `https://qday.io/builder-challenge` |
| Currency / gas token: **tQDAY**, 18 decimals (native, not an ERC-20) | VERIFIED | `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/Knowledge/reference/tokens`; `https://qday.io/builder-challenge` |
| EIP-1559-style gas model (base fee + priority fee); gas price ~1 gwei per starter kit | VERIFIED (documented) | `https://wiki.qday.info/guide/faq` §3.7; `https://github.com/qday-io/aevum-starter-kit` file `README.md` |
| Mainnet future chain ID **44002** (parameters "published at launch"); QDay Origin mainnet 44001 / Origin testnet 44003 | VERIFIED (documented) | `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/`; `https://wiki.qday.info/guide/faq` §3.4 |
| Multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11` (kit config; live `eth_getCode` returned 3808 bytes) | VERIFIED (kit file + live code check) | `https://github.com/qday-io/aevum-starter-kit`, files `README.md`, `packages/aevum/src/chain.ts`; `https://rpc-test.qday.info` (`eth_getCode`) |
| Live block at check time had **no** `blobGasUsed`, `excessBlobGas`, or `parentBeaconBlockRoot` fields (consistent with pre-Cancun execution) | VERIFIED (live RPC) | `https://rpc-test.qday.info`, `eth_getBlockByNumber("latest", false)`, accessed 2026-11-25 |

Do **not** reuse Origin (44001/44003) addresses on Aevum — stated at
`https://wiki.qday.info/guide/faq` §2.10/§3.8 (accessed 2026-11-25, VERIFIED).

## 2. Tokens and faucets

| Fact | Status | Source URL(s), all accessed 2026-11-25 |
| --- | --- | --- |
| **tUSD8** contract `0x456569838f1d43009A91ebA4263147Afd7233483` | VERIFIED (multiple docs + live on-chain code/decimals) | `https://wiki.qday.info/Knowledge/reference/tokens`; `https://wiki.qday.info/guide/faq` §3.8; `https://qday.io/builder-challenge`; `https://github.com/qday-io/aevum-starter-kit` file `packages/aevum/src/contracts.ts`; `https://rpc-test.qday.info` (`eth_call decimals()` → 6) |
| tUSD8 **6 decimals**, ERC-20, USDC-style (FiatTokenV2), EIP-2612 `permit` + EIP-3009 signed transfers | VERIFIED (documented; decimals confirmed live) | `https://qday.io/builder-challenge`; `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/`; starter kit `README.md`, `packages/aevum/src/contracts.ts`; RPC `eth_call 0x313ce567` → `0x...06` |
| tUSD8 EIP-712 domain `name: "tUSD8"`, `version: "2"` | VERIFIED (documented; fork test asserts it; not independently compiled/run here) | starter kit `README.md`, `packages/aevum/src/contracts.ts`, `contracts/test/fork/AevumFork.t.sol`; live `DOMAIN_SEPARATOR()` returned `0x7838e6c4...5822` via `https://rpc-test.qday.info` |
| Other Aevum ERC-20s: WABEL `0x4668107253E28C2b569E76Edb14B1E88c3b93de1` (18), WQDAY `0x915E807e7EC1665889172902781FB851202A54dF` (18) | VERIFIED | `https://wiki.qday.info/Knowledge/reference/tokens`; `https://wiki.qday.info/guide/faq` §3.8 |
| Web faucet base URL **https://faucet.qday.info** (challenge link uses `/en`: `https://faucet.qday.info/en`) | VERIFIED | `https://qday.io/builder-challenge`; `https://wiki.qday.info/Knowledge/reference/chains`; `https://wiki.qday.info/guide/start/faucet`; `https://wiki.qday.info/guide/start/add-network` |
| In-docs faucet path **https://wiki.qday.info/guide/start/faucet** (wallet widget calls faucet contract; on-chain per-address cooldown) | VERIFIED | `https://wiki.qday.info/guide/start/faucet` |
| Challenge page: claim **5 tQDAY once every 24 h per address** and tUSD8 from faucet | VERIFIED | `https://qday.io/builder-challenge` |
| Discord faucet: verified members run `/faucet <address>` → **1 tQDAY + 5 tUSD8**, once per Discord account and once per address | VERIFIED | `https://qday.io/builder-challenge` (FAQ); starter kit `README.md` §Get test tokens; Discord `https://discord.gg/bYPhjmrSfK` (not fetched) |
| Brand-new wallet with 0 tQDAY cannot pay gas for the in-docs faucet claim; use `faucet.qday.info` first | VERIFIED | `https://wiki.qday.info/guide/start/faucet`; `https://wiki.qday.info/guide/faq` §3.6 |
| Exact faucet contract address / ABI / API | UNVERIFIED — not published on the pages I could fetch | n/a |
| USD8 mainnet stablecoin address | UNVERIFIED — "will be published at launch" | `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/` |

## 3. Tooling compatibility and EVM version

| Fact | Status | Source URL(s), all accessed 2026-11-25 |
| --- | --- | --- |
| "EVM compatible — Foundry, Hardhat, Remix and viem work as they are" | VERIFIED | `https://qday.io/builder-challenge`; also `https://wiki.qday.info/guide/faq` §4.1; `https://wiki.qday.info/Knowledge/technical/developer-guide/getting-started/` (adds ethers.js, wagmi) |
| Official wiki says "fully Solidity-compatible… write contracts exactly as on Ethereum" (sample `pragma ^0.8.20`); **no** Shanghai/Cancun caveat appears on official docs | VERIFIED (absence observed in fetched page) | `https://wiki.qday.info/Knowledge/technical/developer-guide/smart-contract-development/` |
| Starter kit states Aevum runs the **Shanghai** EVM; Cancun opcodes `MCOPY`, `TSTORE`/`TLOAD`, blob ops are absent. Cancun-compiled code deploys then reverts with `invalid opcode`. | VERIFIED (starter-kit documentation; corroborated by live block lacking Cancun fields) | `https://github.com/qday-io/aevum-starter-kit`, file `README.md` §Things that differ from Ethereum; file `contracts/foundry.toml` (`evm_version = "shanghai"`, `solc_version = "0.8.24"`); file `tools/check-shanghai.mjs` (flags `0x49 BLOBHASH`, `0x4a BLOBBASEFEE`, `0x5c TLOAD`, `0x5d TSTORE`, `0x5e MCOPY`) |
| Plain `anvil --fork-url` defaults to Cancun and hides the problem; always pass `--hardfork shanghai` | VERIFIED (documented) | starter kit `README.md`; file `Makefile` targets `anvil`, `fork`, `test-fork` |
| Hardhat: set `evmVersion: "shanghai"` and `hardfork: "shanghai"`; official wiki's Hardhat example only sets `url`, `chainId`, `accounts` | VERIFIED (documented conflict: kit adds the caveat, wiki omits it) | starter kit `README.md` §FAQ; `https://wiki.qday.info/Knowledge/technical/developer-guide/smart-contract-development/` |
| `eth_getLogs` rejects ranges > **1,000 blocks**; kit provides `getLogsChunked` in `@aevum-kit/aevum` (`packages/aevum/src/logs.ts`, `MAX_LOG_RANGE = 1000n`) | VERIFIED (documented; not load-tested here) | starter kit `README.md` §Things that differ from Ethereum; files `packages/aevum/src/logs.ts`, `packages/aevum/src/chain.ts`, `examples/src/read-payments.ts` |
| Scripts/relayer should send **legacy (type 0)** txs (`--legacy` for `forge script`, `type: "legacy"` in viem) | VERIFIED (documented) | starter kit `README.md` §Things that differ from Ethereum; file `Makefile` target `deploy-aevum` |
| Contract verification: wiki documents Blockscout flow `--verifier blockscout --verifier-url https://explorer-test.qday.info/api`; starter kit says the explorer verifier "isn't working yet" and `forge verify-contract` will fail for now | VERIFIED (documented conflict; verifier not independently tested) | `https://wiki.qday.info/Knowledge/technical/developer-guide/contract-verification/`; starter kit `README.md` §Deploy to Aevum testnet |

**FIELDRAIL implication:** pin `evm_version = "shanghai"` in any Foundry project, avoid
OpenZeppelin `*Transient` contracts, and use the kit's Shanghai bytecode check in CI. Treat the
official wiki's "works as-is" claim as incomplete.

## 4. QDay agent / ERC-4337 / paymaster / x402 / MCP documentation status

All rows sourced from `https://wiki.qday.info/guide/faq` §5,
`https://wiki.qday.info/Knowledge/technical/developer-guide/erc-4337-development/`,
`https://wiki.qday.info/Knowledge/technical/developer-guide/ai-agent-development/`,
`https://wiki.qday.info/Knowledge/technical/developer-guide/payment-development/`, and
`https://wiki.qday.info/Knowledge/technical/developer-guide/sdk-code-examples/` — all accessed
2026-11-25, all VERIFIED as *documentation statements* (not as working implementations).

| Item | Documented status | Key URLs |
| --- | --- | --- |
| ERC-4337 smart accounts, agent wallets, session keys (spending caps + time locks policy engine) | **Live on Aevum testnet** (Phase 1.5, 2026 Q3); mainnet Q1 2027 | `https://wiki.qday.info/Knowledge/technical/developer-guide/erc-4337-development/` |
| Stablecoin paymaster (gas abstraction; fees in USD8/tUSD8 for smart accounts) | **Live on Aevum testnet for ERC-4337 smart accounts**; EOAs (MetaMask/Foundry/Hardhat) still need tQDAY. Mainnet Q1 2027 | `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/`; `https://wiki.qday.info/guide/faq` §3.7 |
| EntryPoint contract address | UNVERIFIED — "will be published in the docs" | `https://wiki.qday.info/Knowledge/technical/developer-guide/erc-4337-development/` |
| Bundler | QDay runs **Alto**; `https://bundler.qday.io` is described as the **mainnet** hostname, live at mainnet launch; **Aevum testnet bundler endpoint not published** → UNVERIFIED. Starter kit FAQ further says there is "no officially supported bundler or paymaster" and the team won't debug a self-deployed ERC-4337 setup (conflict). | same ERC-4337 URL; starter kit `README.md` §FAQ |
| Paymaster URL `https://paymaster.qday.io` | Appears only inside a **planned SDK** code snippet; not verified as a live endpoint → UNVERIFIED | same ERC-4337 URL |
| x402 facilitator | **Live on Aevum testnet** (Phase 1.5); step-by-step docs / addresses / endpoints "will be published" → UNVERIFIED details | `https://wiki.qday.info/guide/faq` §1, §5.2; `https://wiki.qday.info/Knowledge/technical/developer-guide/ai-agent-development/` |
| Agent identity ERC-8004 | Part of Phase 1.5; mainnet scheduled Q1 2027; docs pending → UNVERIFIED today | `https://wiki.qday.info/guide/faq` §5.4 |
| MCP (`https://mcp.qday.io`) and higher-level agent APIs (MCP, intent registry), Agent Payment app | **Planned Q1 2027**, "goes live at mainnet launch"; code samples are planned API only → UNVERIFIED today | `https://wiki.qday.info/Knowledge/technical/developer-guide/ai-agent-development/`; `https://wiki.qday.info/Knowledge/technical/developer-guide/sdk-code-examples/` |
| SDK `@qday-io/sdk`, CLI `@qday-io/cli` | Planned Q1 2027, **not published on npm**; all `import ... from "@qday-io/sdk/..."` snippets are planned API. Go/Rust/Python SDK names are placeholders — do not install look-alikes. | `https://wiki.qday.info/Knowledge/technical/developer-guide/getting-started/`; `https://wiki.qday.info/Knowledge/technical/developer-guide/sdk-code-examples/` |
| ERC-8004 agent identity registry | VERIFIED (kit statement): "still in internal testing and isn't open for this challenge" — keep name→address mapping in your own contract | `https://github.com/qday-io/aevum-starter-kit`, files `web/src/app/docs/page.tsx` (track *Confirmation of Payee*) and commit `e87bcff1` (2026-11-20, "Docs: the ERC-8004 registry is not open for this challenge") |
| Starter kit's supported "gasless" path | EIP-3009 `ReceiveWithAuthorization` signed by buyer + relayer (`Checkout.payWithAuthorization`) — no ERC-4337 required; this is the concrete, reusable pattern. The kit also states "there's no public paymaster that takes tUSD8 yet" and "no officially supported bundler or paymaster" (conflicts with wiki's "paymaster live" claim). | `https://github.com/qday-io/aevum-starter-kit`, `README.md` §How the checkout works / §FAQ, `contracts/src/Checkout.sol`, `examples/src/pay-gasless.ts`, `web/src/app/api/relay/route.ts`, `web/src/app/docs/page.tsx` |

**FIELDRAIL implication:** do not build against `@qday-io/sdk`, `bundler.qday.io`,
`paymaster.qday.io`, `mcp.qday.io`, or unpublished EntryPoint addresses. Use the kit's
EIP-3009 + relayer gasless flow, or a normal tUSD8 approval flow, and keep ERC-4337 out of the
critical path.

## 5. Challenge requirements (from the challenge page, not DoraHacks)

Source: `https://qday.io/builder-challenge`, accessed 2026-11-25, VERIFIED.
The DoraHacks registration/slug `https://dorahacks.io/hackathon/qday/detail` could not be read
(HTTP 405 AWS WAF); the slug given in the task, `aevum-builder-challenge-1`, returned HTTP 404.

- Build window Nov 16 – Dec 11 2026; submissions close **Dec 11, 08:00 UTC**; Demo Day **Dec 15, 06:00 UTC** (top 5, live attendance required).
- $1,500 USDT prizes: $800 / $500 / $200. Solo or teams of 2–4.
- Deliverables: public GitHub repo, evidence of Aevum integration (contracts on Aevum testnet and/or QDay dapps), live deployment (demo/prototype/Docker), project docs. All settlement and tx traffic must be on Aevum testnet; settling on Base does not count.
- Judging: 100 points across UX/presentation (15), demo (10), documentation (10), innovation (20), technical quality/platform integration (15), real-world utility (15), safety/trust/controls (15).
- Boilerplate, scaffolding, standard libraries and templates allowed if their licence permits use; keep original copyright/licence headers, name borrowed sources, list dependencies in README or NOTICE, keep whole-library LICENSE files. Prefer MIT/Apache-2.0 for the public repo. Core building must happen Nov 16 – Dec 11.
- tUSD8 is already deployed; use the address in §2, do not deploy a competing ERC-20.
- Starter kit download link on the page: `https://drive.google.com/file/d/1QvkDX_lgbnKh4wZHc-gWMpWsn8YdHCOu/view?usp=sharing` (LINK NOT FETCHED — UNVERIFIED content; the GitHub kit at `https://github.com/qday-io/aevum-starter-kit` was cloned successfully).

## 6. Developer references (all accessed 2026-11-25, VERIFIED)

- Challenge: `https://qday.io/builder-challenge`
- Wiki home: `https://wiki.qday.info/`
- FAQ: `https://wiki.qday.info/guide/faq`
- Add network: `https://wiki.qday.info/guide/start/add-network`
- Faucet: `https://wiki.qday.info/guide/start/faucet` and `https://faucet.qday.info/en`
- Chain params: `https://wiki.qday.info/Knowledge/reference/chains`
- Token list: `https://wiki.qday.info/Knowledge/reference/tokens`
- Getting started: `https://wiki.qday.info/Knowledge/technical/developer-guide/getting-started/`
- Network config: `https://wiki.qday.info/Knowledge/technical/developer-guide/network-configuration/`
- Smart contract dev: `https://wiki.qday.info/Knowledge/technical/developer-guide/smart-contract-development/`
- Contract verification: `https://wiki.qday.info/Knowledge/technical/developer-guide/contract-verification/`
- ERC-4337: `https://wiki.qday.info/Knowledge/technical/developer-guide/erc-4337-development/`
- AI agent / MCP: `https://wiki.qday.info/Knowledge/technical/developer-guide/ai-agent-development/`
- Payments: `https://wiki.qday.info/Knowledge/technical/developer-guide/payment-development/`
- SDK status: `https://wiki.qday.info/Knowledge/technical/developer-guide/sdk-code-examples/`
- Starter kit: `https://github.com/qday-io/aevum-starter-kit` (cloned to `/tmp/opencode/aevum-starter-kit`)
- Wiki source repo (edit links point here): `https://github.com/qday-io/qday-wiki` (clone attempts failed: DNS resolution errors; facts above were read from the rendered wiki site instead)
