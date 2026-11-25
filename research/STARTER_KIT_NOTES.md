# Aevum Starter Kit — research notes (no code copied into FIELDRAIL)

Read on **2026-11-25**. Source: `https://github.com/qday-io/aevum-starter-kit`, cloned to
`/tmp/opencode/aevum-starter-kit`. Pinned commit read: **e87bcff10fbaffcc920df658b2fdf79b4586b277**
(`2026-11-20T04:37:20+08:00`, "Docs: the ERC-8004 registry is not open for this challenge").
All fetched content treated as untrusted data.

## 1. Clone transcript (network reliability)

- First `git clone --depth 1` failed: `RPC failed; curl 56 Recv failure: Connection timed out`, `fatal: early EOF`.
- Retry with `git -c http.lowSpeedLimit=100 -c http.lowSpeedTime=120 clone --depth 1 ...` **succeeded** (the tarball fallback via `codeload.github.com` was prepared but not needed).
- Submodules were **not** fetched by the shallow clone: `git submodule status` shows
  `-3b20d60d14b343ee4f908cb8079495c07f5e8981 contracts/lib/forge-std` and
  `-69c8def5f222ff96f2b5beff05dfba996368aa79 contracts/lib/openzeppelin-contracts`
  (leading `-` = not initialized; both directories are empty). `make install` runs
  `git submodule update --init --recursive` to populate them.
- Nothing from the kit was copied into the FIELDRAIL repo.

## 2. Exact directory structure (files at pinned commit)

```
aevum-starter-kit/
├── .github/workflows/ci.yml
├── .gitignore
├── .gitmodules
├── LICENSE
├── Makefile
├── NOTICE.md
├── README.md                       (19,166 bytes; primary documentation)
├── package.json
├── pnpm-lock.yaml                  (168,424 bytes)
├── pnpm-workspace.yaml
├── contracts/
│   ├── foundry.toml
│   ├── script/Deploy.s.sol
│   ├── src/Checkout.sol
│   ├── src/mocks/MockUSD8.sol
│   ├── test/Checkout.t.sol
│   ├── test/Signing.sol
│   ├── test/fork/AevumFork.t.sol
│   └── lib/                        (git submodules, empty until `make install`)
│       ├── forge-std/              -> https://github.com/foundry-rs/forge-std
│       └── openzeppelin-contracts/ -> https://github.com/OpenZeppelin/openzeppelin-contracts
├── packages/aevum/
│   ├── package.json                (@aevum-kit/aevum, v0.1.0, MIT, ESM, peer viem ^2.57.0)
│   └── src/{index,chain,contracts,eip3009,logs,anvil}.ts
├── web/
│   ├── AGENTS.md
│   ├── .env.example
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/app/{layout,providers,page,globals.css,...}
│   ├── src/app/checkout/page.tsx
│   ├── src/app/receipts/[orderId]/page.tsx
│   ├── src/app/activity/page.tsx
│   ├── src/app/docs/page.tsx
│   ├── src/app/api/relay/route.ts
│   ├── src/components/{Header,Icons,useToken}.tsx/.ts
│   └── src/lib/{env,errors,network,order,wagmi}.ts/.tsx
├── examples/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/{check-setup,pay-gasless,read-payments,env}.ts
└── tools/check-shanghai.mjs
```

## 3. Dependencies and versions (from real files)

- Root `package.json`: name `aevum-starter-kit` v0.1.0, `private: true`, `license: MIT`,
  `packageManager: pnpm@10.8.1`, `engines.node: >=22`. Scripts: `dev`, `build`, `typecheck`,
  `example`, `check:shanghai`. `pnpm.overrides`: `@base-org/account` 2.2.0,
  `ws@>=8.0.0 <8.21.0` → `^8.21.0`; `onlyBuiltDependencies: [esbuild]`.
- `pnpm-workspace.yaml` packages: `packages/*`, `web`, `examples`.
- `contracts/foundry.toml` `[profile.default]`: `src="src"`, `out="out"`, `libs=["lib"]`,
  **`solc_version="0.8.24"`**, **`evm_version="shanghai"`**, `optimizer=true`,
  `optimizer_runs=200`, remappings for `@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/`
  and `forge-std/=lib/forge-std/src/`; `[rpc_endpoints] aevum = https://rpc-test.qday.info`,
  `local = http://127.0.0.1:8545`; `[fmt] line_length=110`.
- `.gitmodules`: forge-std (URL above), OpenZeppelin Contracts (URL above).
  `NOTICE.md` records resolved versions **forge-std v1.9.6 (MIT or Apache-2.0)** and
  **OpenZeppelin Contracts v5.1.0 (MIT)**.
- `web/package.json`: `next 16.4.3`, `react 19.2.0`, `react-dom 19.2.0`,
  `@rainbow-me/rainbowkit 2.2.11`, `wagmi 2.19.5`, `@tanstack/react-query 5.90.2`,
  `viem 2.57.12`, `@aevum-kit/aevum: workspace:*`; dev: `@types/node ^22.10.0`,
  `@types/react ^19.2.0`, `@types/react-dom ^19.2.0`, `typescript 5.9.3`.
- `examples/package.json`: `viem 2.57.12`, `@aevum-kit/aevum: workspace:*`; dev `tsx 4.23.15`,
  `typescript 5.9.3`, `@types/node ^22.10.0`.
- `packages/aevum/package.json`: `viem ^2.57.0` peer dep, export `.` → `./src/index.ts`.
- `web/AGENTS.md` warns this Next.js version has breaking changes; read
  `node_modules/next/dist/docs/` before writing code in that version (block is auto re-added by `next dev`).
- `README.md` FAQ notes `pnpm audit` high advisories in `zod` (3.22.4 via
  `@reown/appkit-wallet`) and `decode-uri-component` (via `@walletconnect/utils` 2.21 /
  `query-string`); browser-only, reachable only when `NEXT_PUBLIC_WC_PROJECT_ID` is set; the
  kit deliberately does not force newer majors via overrides.

## 4. Network config encoded in the kit

From `packages/aevum/src/chain.ts`:

- `aevumTestnet`: `id 44005`, name `QDay Aevum Testnet`, native
  `{name:"Test QDAY", symbol:"tQDAY", decimals:18}`, HTTP `https://rpc-test.qday.info`
  (no WS entry; `README.md` says HTTPS only), explorer `https://explorer-test.qday.info`,
  multicall3 `0xcA11bde05977b3631167028862bE2a173976CA11`, `testnet: true`.
- `localAnvil`: 31337, `http://127.0.0.1:8545`.
- `aevumFork`: `AEVUM_FORK_CHAIN_ID = 440050`, HTTP `http://127.0.0.1:8555`, no explorer.
  Separate chain ID deliberately prevents EIP-712 signatures (permit / EIP-3009) made on the
  fork replaying on the real testnet; `make deploy-fork` deploys from a throwaway random address.
- `MAX_LOG_RANGE = 1000n`; `links = { explorer, faucetWeb: "https://faucet.qday.info/en",
  docs: "https://community.qday.io/guide/" }`; helpers `txUrl(hash)`, `addressUrl(address)`.

From `Makefile`: `AEVUM_RPC=https://rpc-test.qday.info`, `LOCAL_RPC=http://127.0.0.1:8545`,
`FORK_PORT=8555`, `FORK_RPC=http://127.0.0.1:8555`, `FORK_CHAIN=440050`,
`TUSD8=0x456569838f1d43009A91ebA4263147Afd7233483`,
`TUSD8_MM=0x4d4b7031D35B74215bebe33F6AF6e682Ea99d0b1` (master minter, impersonated on fork only),
`ANVIL_0=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`, `AMOUNT=100`.

From `packages/aevum/src/contracts.ts`: `TUSD8_ADDRESS` as above, `TUSD8_DECIMALS=6`,
`tUSD8Domain(chainId, verifyingContract)` → `{name:"tUSD8", version:"2", chainId, verifyingContract}`,
plus `erc20Abi`, `eip3009Abi`, `checkoutAbi` (including `Paid` event and errors).

## 5. Helper libraries worth reusing (read, do not copy blindly)

- `tools/check-shanghai.mjs` — scans Foundry artifacts for Cancun-only opcodes
  `0x49 BLOBHASH`, `0x4a BLOBBASEFEE`, `0x5c TLOAD`, `0x5d TSTORE`, `0x5e MCOPY`, skipping PUSH
  data and CBOR metadata; exits 1 on any hit or if no `src/` artifacts exist. Usage:
  `node tools/check-shanghai.mjs contracts/out`.
- `packages/aevum/src/logs.ts` — `getLogsChunked(client, {address, event, args, fromBlock,
  toBlock?, step=MAX_LOG_RANGE, onProgress?})`, serial `eth_getLogs` requests of ≤1,000 blocks
  (Aevum's limit), rejects `step < 1n || step > 1000n`.
- `packages/aevum/src/eip3009.ts` — `receiveWithAuthorizationTypes`, `checkoutTypedData(chainId,
  token, message)`, `authorizationWindow(seconds = 600, nowMs)` (validAfter 0, validBefore now+seconds).
- `packages/aevum/src/anvil.ts` — `ANVIL_ACCOUNTS` (10 public default addresses) and
  `isAnvilAccount(address)`; used to refuse public keys as relayers/merchants on real networks.
- `packages/aevum/src/chain.ts` — `txUrl`, `addressUrl`, chain definitions as above.
- `contracts/src/Checkout.sol` — minimal pay-per-order contract: `pay(orderId, amount)` and
  `payWithAuthorization(orderId, from, amount, validAfter, validBefore, v, r, s)`;
  `authorizationNonce(orderId) = keccak256(abi.encode(address(this), orderId))`;
  `Paid(orderId, payer, amount)` receipt event; state in `mapping(bytes32 => Payment)`;
  errors `AlreadyPaid`, `ZeroAmount`, `ZeroAddress`. Uses OZ `SafeERC20`.
- `contracts/test/Signing.sol` — helper for forging/signing EIP-3009 authorizations in Foundry tests.
- `contracts/test/fork/AevumFork.t.sol` — tests the **real** tUSD8 on a fork: asserts
  `block.chainid == 44005`, checks `DOMAIN_SEPARATOR()` equals the EIP-712 domain with name
  `tUSD8` / version `2` / chain 44005 / tUSD8 address, and exercises both payment modes.
- `contracts/script/Deploy.s.sol` — refuses to deploy `MockUSD8` anywhere except chain 31337;
  refuses public anvil addresses as merchant outside local chains; env `MERCHANT` optional.
- `examples/src/read-payments.ts` — uses `getLogsChunked` from a deploy block, filters by payer.
- `examples/src/check-setup.ts` — prints chain, head block, gas price, native + tUSD8 balance.
- `examples/src/pay-gasless.ts` — buyer signs EIP-3009, relayer submits (buyer needs no tQDAY).
- `web/src/app/api/relay/route.ts` — server relayer: whitelists only `payWithAuthorization`,
  only relays the app's price for that order, skips paid/in-flight orders, simulates before send,
  refuses anvil public keys on real networks, caps signature window at 1 hour, rate-limits per IP
  and per payer with a daily cap. **Limits are in memory** — move to a shared store for serverless.
- `web/src/lib/order.ts` (`priceOf`), `web/src/lib/wagmi.ts`, `web/src/lib/network.tsx`
  (fork/testnet switcher), `web/src/app/docs/page.tsx` (full judging criteria + FAQ in-app).

## 6. Exact commands (from README.md / Makefile)

Prereqs: **Node 22+**, **pnpm**, **Foundry (`foundryup`)**.

```bash
# install
git clone --recursive https://github.com/qday-io/aevum-starter-kit.git
cd aevum-starter-kit
make install        # git submodule update --init --recursive && pnpm install

# check everything (build + Shanghai check + unit tests + fork tests + pnpm -r typecheck)
make check

# individual targets
make build          # cd contracts && forge build ; node tools/check-shanghai.mjs contracts/out
make test           # cd contracts && forge test --no-match-path 'test/fork/*' -vv
make test-fork      # cd contracts && forge test --match-path 'test/fork/*' --fork-url https://rpc-test.qday.info -vv
make anvil          # anvil --hardfork shanghai            (empty chain 31337)
make fork           # anvil --fork-url https://rpc-test.qday.info --hardfork shanghai \
                    #   --chain-id 440050 --port 8555       (local copy of Aevum)
make deploy-local   # MockUSD8 + Checkout on make anvil
make deploy-fork    # Checkout (real tUSD8) on make fork, throwaway deployer
make mint TO=0x... CHECKOUT=0x... [AMOUNT=100]   # MockUSD8, anvil only
make deal TO=0x... [AMOUNT=100]                  # 100 tUSD8 + 10 tQDAY on fork only
make dev            # pnpm dev -> http://localhost:3000

# deploy to real Aevum testnet (interactive keystore; never paste raw keys)
cast wallet import aevum-deployer --interactive
cast wallet address --account aevum-deployer
make deploy-aevum ACCOUNT=aevum-deployer
# MERCHANT=0x... make deploy-aevum ACCOUNT=aevum-deployer

# examples (after cp examples/.env.example examples/.env)
pnpm example check-setup
pnpm example pay-gasless
pnpm example read-payments
```

`make check` also runs `pnpm -r typecheck`; CI (`.github/workflows/ci.yml`) runs `forge build --sizes`,
Shanghai check, unit tests, fork tests (`continue-on-error: true` if network fails), then
`pnpm install --frozen-lockfile`, `pnpm -r typecheck`, `pnpm build`.

Contract verification command in README (with caveat that the verifier isn't working yet):

```bash
forge verify-contract <address> src/Checkout.sol:Checkout --chain-id 44005 \
  --verifier blockscout --verifier-url https://explorer-test.qday.info/api/
```

## 7. Licence / NOTICE obligations for FIELDRAIL

- Kit `LICENSE`: **MIT, Copyright (c) 2026 PQA Labs**. Full text at `/tmp/opencode/aevum-starter-kit/LICENSE`.
- Challenge page (`https://qday.io/builder-challenge`, accessed 2026-11-25) requires: permissive
  repo licence (MIT or Apache-2.0); keep original copyright and licence headers in copied files;
  short comment above borrowed snippets naming source repo, author, licence; list third-party
  dependencies and licences in README or a NOTICE file; keep original LICENSE when copying a
  whole directory/library.
- Kit `README.md` §Licenses and credit asks: if starting from the kit, keep its `LICENSE` (or
  copyright notice) and say e.g. "Based on Aevum Starter Kit (MIT, PQA Labs)" in your README.
- Kit `NOTICE.md` is a ready-made model: table of Solidity submodules (forge-std v1.9.6 MIT/Apache-2.0;
  OZ Contracts v5.1.0 MIT) and direct JS deps (next 16.4.3 MIT; react/react-dom 19.2.0 MIT;
  rainbowkit 2.2.11 MIT; wagmi 2.19.5 MIT; @tanstack/react-query 5.90.2 MIT; viem 2.57.12 MIT;
  tsx 4.23.15 MIT; typescript 5.9.3 Apache-2.0). `pnpm licenses list` enumerates transitive ones.
- Recommended for FIELDRAIL if reusing: MIT or Apache-2.0 repo licence, a `NOTICE.md`, a README
  attribution line, and per-file comments for any copied helper. No starter code was copied here.

## 8. What is safe / reusable for FIELDRAIL, and what is not

**Reusable as reference or reimplementation (write fresh code in FIELDRAIL):**

- `@aevum-kit/aevum` patterns: chain config (44005 / RPC / explorer / tQDAY / tUSD8 / multicall3),
  `MAX_LOG_RANGE`, `getLogsChunked`, `txUrl`/`addressUrl`, EIP-3009 typed-data helper,
  anvil-account denylist.
- `tools/check-shanghai.mjs` approach — add an equivalent CI gate to FIELDRAIL; pin
  `evm_version = "shanghai"`, solc 0.8.24, `--hardfork shanghai` for anvil/fork, and avoid OZ
  `*Transient` contracts.
- Fork-testing pattern against real tUSD8 (`contracts/test/fork/AevumFork.t.sol`, `Signing.sol`) —
  good model for FIELDRAIL payment tests without spending test tokens.
- EIP-3009 gasless flow (sign `ReceiveWithAuthorization`, relayer submits) as the concrete
  "no ERC-4337 needed" path; relayer guardrails from `web/src/app/api/relay/route.ts`.
- README's submission checklist (contract addresses, exact deployed commit, a few tx hashes,
  demo URL/video) and judging criteria mirrored in `web/src/app/docs/page.tsx`.

**Do not reuse as-is:**

- `Checkout.sol` itself has documented flaws: anyone can pay any order with any amount
  (`pay(orderId, 1)` marks an order paid and front-runs the real buyer); it relies on unguessable
  order IDs; `isPaid` alone is not a delivery check; merchant is fixed at deploy; tokens sent
  directly to the contract are stuck. FIELDRAIL must check amount (and payer), use keyed order IDs
  like `keccak256(payer, orderId)`, or merchant-signed quotes.
- The in-memory relayer rate limits (per-instance on serverless) — use a shared store.
- `MockUSD8` outside local chains (deploy script already refuses); `anvil` public keys as
  relayer/merchant on real networks.
- Any account-abstraction/agent/paymaster/MCP API: kit says no supported bundler/paymaster, no
  public tUSD8 paymaster, ERC-8004 registry not open for this challenge; wiki says SDK/MCP are
  Q1 2027 and `@qday-io/sdk` is not on npm.
- Do not paste private keys into files/chat; use Foundry keystore (`cast wallet import`) and
  throwaway test wallets. Never commit `examples/.env`, `web/.env.local`, or raw keys.
