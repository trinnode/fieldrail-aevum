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

## Dependency provenance

The remote `forge install` of OpenZeppelin v5.4.0 could not complete on this
host (repeated `fetch-pack: unexpected disconnect` / early EOF). To keep the
build reproducible and offline-capable, `contracts/lib/` contains minimal,
behaviour-compatible local shims for the exact OpenZeppelin surfaces used
(`IERC20`, `ERC20`, `SafeERC20`, `ReentrancyGuard`, `ECDSA`, `EIP712`) and the
small forge-std surface used by tests/scripts. This is **not** a claim that the
shims are a formally audited dependency. Before any real-value deployment,
replace them with the pinned upstream v5.4.0 sources and re-run this suite.
