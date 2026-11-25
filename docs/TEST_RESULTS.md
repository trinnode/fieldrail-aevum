# Test results — contracts

Recorded 2026-11-25 on the build host. All commands run from `contracts/`.

| Command | Result |
| --- | --- |
| `forge build` (`solc 0.8.24`, `evm_version=shanghai`) | Compiler run successful, no errors |
| `forge fmt --check` | exit 0 |
| `forge test -vvv` | `Ran 2 test suites ... 43 tests passed; 0 failed; 0 skipped` |
| `forge test --match-path test/FieldrailProgramVault.t.sol` | 42 passed (unit + 4 fuzz tests) |
| `forge test --match-path test/FieldrailInvariants.t.sol` | 1 passed — `testFuzz_InvariantsHoldAcrossManyPayments(uint256)`, 256 runs × 12 state-changing steps |

## Coverage notes

- Unit tests cover creation, funding, category/team configuration, supplier
  registration and revocation, mandate scope/expiry/caps, successful signed
  payment, signature forgery, wrong programme/team/category/token/payee,
  unapproved/revoked suppliers, unauthorised/revoked/expired agents, all nested
  budget ceilings, zero amount, expired invoice/programme, invoice-ID and nonce
  replay, cross-vault signature replay, pause/resume, close/refund rules, and
  the absence of any arbitrary agent transfer path.
- Fuzz tests cover amounts, per-invoice caps, deadlines and nonce values.
- The invariant campaign asserts after every step: `totalSpent <= totalFunded`,
  category spend within category cap, team/category spend within allocation,
  agent spend within mandate cap, unapproved supplier balance unchanged, and
  vault solvency (`token balance >= getFundsRemaining()`).

## Live-state fork verification

Command: `forge test --match-contract ForkJourneyTest --fork-url https://rpc-test.qday.info -vvv`

Result: `[PASS] testRealTUSD8JourneyOnAevumFork()`. The trace shows live tUSD8
`decimals() = 6`, a real ERC-20 transfer of 20 tUSD8 from a discovered holder to
a throwaway sponsor, factory/vault deployment, funding, configuration, a valid
supplier signature recovery, `InvoicePaid`, a real tUSD8 transfer of 1 tUSD8 to
the supplier, and a final `InvoiceAlreadyUsed` revert on replay.

This is a fork simulation. It is not a live Aevum transaction and there is no
transaction hash.

## Web and MCP checks

| Command | Result |
| --- | --- |
| `pnpm --filter @fieldrail/web typecheck` | exit 0 |
| `pnpm --filter @fieldrail/web build` | Next.js 16 production build, 9 routes generated |
| `pnpm --filter @fieldrail/web test` | **45 tests passed** across `policy.test.ts` and `edge-cases.test.ts`: money parsing (including malformed inputs), identifier parity with Solidity keccak hashes, every policy gate refusing a payment, boundary acceptance, and custom-error decoding |
| `pnpm --filter @fieldrail/mcp-server typecheck` | exit 0 |
| `node scripts/mcp-smoke.mjs` | 11 tools listed; deterministic parser returned a valid draft; write tool refused without opt-in |

## Browser and responsive checks

Headless Chromium against `next start` on every route, desktop 1440px and mobile 390px:

- All 9 routes returned HTTP 200 and rendered without missing CSS/assets.
- Landing page inspected at both sizes: no horizontal overflow, original inline SVG logo renders, 3D passport card and Aceternity beams/spotlight/moving-border/text effects are present.
- All invoice/workflow screens inspected at mobile width: forms, selects and notices remain within the viewport.
- `prefers-reduced-motion: reduce` verified: the animated headline renders its full sentence immediately rather than staying blurred.

Effect sources: official Aceternity registry JSON fetched on 2026-11-25 from
`https://ui.aceternity.com/registry/<component>.json`. Components were copied in
and adapted (light palette, green/copper gradients, reduced-motion handling).
`spotlight-new` replaced `card-spotlight` to avoid pulling Three.js / R3F.

## Dependency provenance

The remote `forge install` of OpenZeppelin v5.4.0 could not complete on this
host (repeated `fetch-pack: unexpected disconnect` / early EOF). To keep the
build reproducible and offline-capable, `contracts/lib/` contains minimal,
behaviour-compatible local shims for the exact OpenZeppelin surfaces used
(`IERC20`, `ERC20`, `SafeERC20`, `ReentrancyGuard`, `ECDSA`, `EIP712`) and the
small forge-std surface used by tests/scripts. This is **not** a claim that the
shims are a formally audited dependency. Before any real-value deployment,
replace them with the pinned upstream v5.4.0 sources and re-run this suite.
