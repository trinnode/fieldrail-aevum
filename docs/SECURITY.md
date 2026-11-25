# Security and operational safety

## Key separation

| Key | Purpose | Rule |
| --- | --- | --- |
| Sponsor wallet | Configure programme, pause, close, refund | Never given to the MCP server, browser or agent. Never committed. |
| Deployer key | Deploy factory/vaults | Dedicated throwaway testnet key. Never the sponsor key. |
| Agent session key | Submit `payInvoice` only | Must derive to the configured agent address. MCP write tool is disabled unless explicitly opted in. |
| Supplier key | Sign invoices off-chain | Held by the supplier; only the signature reaches the app. |

No private key, mnemonic or full `.env` is tracked in this repository. `scripts/guard-secrets.sh` scans tracked files and the staged diff before every push.

## Supported guarantees

- Nested programme/category/team budget enforcement at execution time.
- Supplier EIP-712 signature bound to vault, chain and invoice fields.
- Agent scope, per-invoice cap, lifetime cap and expiry.
- Invoice-ID and supplier-nonce replay protection.
- Immediate sponsor revocation of suppliers and agents.
- Sponsor-only pause, close and refund with documented closure rules.
- Reentrancy protection and safe ERC-20 transfers.

## Unsupported guarantees

- Not a formal audit. Tests and static checks are not third-party review.
- No KYC/AML, sanctions screening, donor compliance or accounting attestation.
- No legal claim that funds are restricted in any jurisdiction.
- No post-quantum claim. Aevum accounts and this prototype use ECDSA.
- No QDay native ERC-4337/session-key/paymaster integration is claimed.
- No guarantee against sponsor key compromise or a malicious/upgraded token contract beyond the documented safe-transfer checks.

## Before any real-value deployment

1. Replace `contracts/lib/` shims with pinned upstream OpenZeppelin v5.4.0 and forge-std, then re-run the full suite.
2. Run Slither and Aderyn, review every warning, and obtain an external audit.
3. Verify token decimals and code on the target chain.
4. Move all admin actions to multisig/timelock; rotate test keys.
5. Complete jurisdiction-specific legal and safeguarding review.
