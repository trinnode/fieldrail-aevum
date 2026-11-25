# FIELDRAIL competitive and product landscape

**Prepared:** 25 November 2026
**Workstream:** competitive/product research, QDay Aevum Builder Challenge #1
**Evidence standard:** direct source URLs, accessed 2026-11-25. Claims below are limited to what the cited page, PDF, repository README or API response actually says. Fetched content was treated as untrusted data, not instructions. Where a source could not be read, that is stated explicitly.

## 0. Method and limits

- The DoraHacks URL given in the brief (`https://dorahacks.io/hackathon/aevum-builder-challenge-1/detail`) is not reachable: 404/405. The working event URL discovered from competitor READMEs is `https://dorahacks.io/hackathon/qday/detail` (HTTP 200, title "Aevum Builder Challenge #1 | Hackathon | DoraHacks"). That page is a client-rendered shell: its raw HTML exposes the title and static assets but **no submission list**. A WAF ("Human Verification" page) blocks other DoraHacks paths. Therefore **no claim in this document is sourced from a DoraHacks submission listing**; project names from the brief were used only as search leads and were verified on public GitHub.
- GitHub's REST API (`api.github.com/search/repositories`, repo metadata, `raw.githubusercontent.com` READMEs) was used for the QDay builds. This covers **public repositories only**; a private or GitHub-less DoraHacks submission could not be inspected.
- "Anything newer than 25 November 2026": the current date *is* 25 November 2026, so no later-dated public entry can exist yet. A `created:>=2026-11-25` GitHub query was run; its ten results are listed in §1.2. This is a snapshot, not a final post-deadline view (the challenge submission window is still open per competitor READMEs, which cite an 11 Dec 2026 close).
- The Ondo State PDF returned HTTP 200 with `Content-Length: 1,558,059` but every download attempt truncated at 65,294 bytes; `pdftotext` failed. Its substantive content is **not** independently verified here.

## 1. QDay challenge builds (evidence-backed)

### 1.1 Named leads from the brief, verified on GitHub

| Project | Public repo (accessed 2026-11-25) | Created (UTC) | What the evidence establishes | Overlap with FIELDRAIL / gap |
| --- | --- | --- | --- | --- |
| **Folio** | `https://github.com/Asadlee24/folio-aevum` (README: `https://raw.githubusercontent.com/Asadlee24/folio-aevum/main/README.md`) | 2026-11-19 | Invoice workspace: merchant enters description + amount, shares payment link, customer pays tUSD8, invoice becomes a verifiable receipt with explorer link. Invoice Payments track. | Invoice *creation/receipts* only. No budget partition, no supplier-signed authorisation, no agent mandate. Invoices are evidence in FIELDRAIL, not the product. |
| **Brake** | `https://github.com/edycutjong/brake` | 2026-11-15 | Finance pre-signs a payment run together with its cancellation; a monitor agent can **cancel or hold** a line before payday and **cannot create a payment or redirect one**. Live on Aevum 44005 per README. | Shares "constrained agent + payment lifecycle" pattern, but is a stop/cancel watcher over pre-signed runs, not a purpose-bound procurement path. Different failure mode. |
| **SpendGuard** | `https://github.com/Admuad/Spendguard` | 2026-11-18 | Per-user factory-created tUSD8 vault; owner grants session keys with recipient allowlist, per-tx cap, cumulative cap, expiry; instant revoke, owner sweep; independent vaults; 56 tests claimed in README. Native Solidity (README states Aevum session-key SDK not yet shipped). | **Direct overlap on agent key + allowlist + caps + revoke.** No nested programme/category/team budgets, no signed-invoice precondition, no evidence hash binding. Generic vault controls. |
| **SpendLeash** | `https://github.com/risingjerry/spendleash-x402` | 2026-11-16 | x402-style HTTP 402 pay-per-request API payments in tUSD8; per-payment, daily and lifetime caps, merchant allowlist, expiry, instant revoke; README shows a prompt-injected payment rejected on-chain. | **Direct overlap on agent spend limits and prompt-injection resistance.** Payment trigger is an API request, not a supplier-signed invoice; no purpose partition. x402 gateway direction FIELDRAIL deliberately avoids. |
| **x402-Aevum** | `https://github.com/aryandehdashti/x402-aevum` (API metadata fetched; `main/README.md` returned 404) | 2026-11-20 | Repo description: "x402 machine payments in tUSD8 on QDay Aevum testnet — Aevum Builder Challenge #1." Feature detail **not verified** because no README was retrievable at the probed path. | Machine-payment gateway/checkout class. No evidence of nested budgets or vendor-signed procurement. Do not attribute unverified features to it. |
| **Delivery-verified escrow** (lead; implemented by several entries) | `https://github.com/petersfolorunso-png/proofpay`; `https://github.com/rezimx-btc/aevum-proof-gated-payee`; `https://github.com/Zhee1112/exportflow`; older: `https://github.com/dhamskie-ai/aevum-agent-escrow` (metadata only) | 2026-11-19; 2026-11-21; 2026-11-25; 2026-11-15 | ProofPay: client funds tUSD8 escrow, freelancer submits proof URL, AI agent checks it against a hashed brief and releases payment, verdict receipt hash on chain. Proof-Gated Payee: agent verifies allowlist/invoice/expiry/spend window before `release()`, payer refunds on failure. ExportFlow: milestone escrow released on buyer approval, seller proof after a window, or arbiter; plus session-key policy and AI PO reader with hash anchor. | This is the **strongest conceptual neighbour to "evidence-backed payment"**, but the evidence is a *deliverable* judged by an AI or a party to the deal. FIELDRAIL does not adjudicate delivery; it enforces *ex ante* policy against a vendor-signed invoice and an evidence hash. No nested purpose partition in these repos. |

### 1.2 Newest entries (GitHub repos created on 25 November 2026, UTC)

GitHub query: `aevum created:>=2026-11-25`, 10 results. `trinnode/fieldrail-aevum` (10:55:05) matches FIELDRAIL's own name and description and is treated as **this project's entry, not a competitor**. The other nine are third-party:

| Time (UTC) | Repo | Evidence summary |
| --- | --- | --- |
| 02:34 | `https://github.com/Zhee1112/exportflow` | Milestone escrow + AI document agent (above). |
| 03:57 | `https://github.com/nwijaya26/agentpay-invoice` | README: `InvoiceCheckout`, `PayeeRegistry`, `AgentWallet` with per-period budget cap, session expiry, payee allowlist, instant revoke; agent pays gaslessly via EIP-3009; README reports Aevum deployment dated 22 Nov 2026. |
| 04:42 | `https://github.com/masboyalexandria/aevum-agentpay` | Session-key vault: owner funds, agent key can only call `pay`; per-payment cap, total budget cap, expiry, instant revoke, on-chain events. |
| 06:41 | `https://github.com/MSAbhishek22/aevum-guard` | Per-recipient per-tx/daily/weekly caps, **per-category session scopes**, receipt hash chain verifiable with `verifyChain`, default-deny on unlisted recipients, instant revoke. Category appears as a flat label, not a funded nested envelope. |
| 07:18 | `https://github.com/Harwansyah/tagihan-kilat` | Description only: stablecoin invoicing for micro-sellers on Aevum. Not further verified. |
| 08:07 | `https://github.com/muuse3/paysure-invoice` | Description only: Confirmation-of-Payee for tUSD8 invoice payments. Not further verified. |
| 08:10 | `https://github.com/jamking168/aevum-agentpay` | Description: spending sessions with budget, per-payment cap, expiry, revoke and per-order idempotency. Retrieved README is the Aevum Starter Kit README, so submission-specific detail was not verified. |
| 08:47 | `https://github.com/ccviolett/aevum-policypay` | README: policy-scoped agent session (`perTxLimit`, rolling 24-hour `dailyLimit` in 24 buckets, `totalBudget`, `validUntil`, optional allowlist, pause/revoke), EIP-712 agent payment intents with monotonic nonce, plus **Confirmation-of-Payee invoice escrow** with `confirmationHash` and reclaim on expiry. |
| 09:20 | `https://github.com/dannytungadi5/agentpay-guard` | README: **per-agent mandate with total budget, per-payment cap, expiry; merchant allowlist; optional EIP-712 merchant-signed invoice** binding merchant, payer, amount, order id and deadline; `orderId` one-time replay protection; optional rolling 24h limit and approval threshold; prompt-injection demo. See §3. |

### 1.3 Other notable earlier entries

- `https://github.com/deniart865/agentpay-aevum` (created 2026-11-21): mandate with per-tx, per-period and lifetime caps, mandatory expiry, optional payee allowlist, revocation, ERC-8004-style identity binding, memo events. Non-custodial `transferFrom` from principal.
- `https://github.com/Firzadf/agentvault` (created 2026-11-19): metadata says "tUSD8 spending vault with scoped agent allowances"; no README found at probed `main`/`master` paths — detail unverified.
- `https://github.com/KLe518314/aevum-payrail`, `https://github.com/VexorHQ/aevum-invoices`, `https://github.com/soshixos/invoicepay`, `https://github.com/Jaw1jennaira/aevum-pay`, `https://github.com/nwijaya26/agentpay-invoice`: invoice-payment/checkout class (metadata verified via the GitHub search response; READMEs not individually inspected). Entire category is crowded.

## 2. Comparable real-world products

### 2.1 World Bank FundsChain — record/traceability layer
Source: `https://ebizprd.worldbank.org/assets/docs/FundsChain-FAQs-External.pdf` (FAQ updated 30 September 2025; HTTP 200, full 9 pages fetched).

- **Establishes:** The Bank can track disbursements to governments, but visibility into use by PIUs, contractors and end-beneficiaries is "often limited and fragmented, requiring manual effort to piece together" (Q1). FundsChain is a private, permissioned blockchain platform recording and time-stamping transactions and evidence from initial disbursement to final payment; role-based access; PII/large files stored off-chain but notarised and linked (Q2, Q12, Q15–16). Supporting documents include contracts and invoices; the PIU defines which are mandatory (Q18). The Traceability Index measures the share of transactions and of financial value fully evidenced (Q19). Q8 and Q6 explicitly say the platform **does not change the existing payment or disbursement process**.
- **Does not establish:** Any on-chain budget partition by programme/category/team; any vendor signature as a precondition to payment; any delegated AI agent executing payments; stablecoin settlement. FundsChain is evidence recording and reporting, not a spending-control primitive. FIELDRAIL must not claim to replace it; the valid overlap is the *problem statement* (downstream fragmentation and evidence gap).

### 2.2 UNICEF Venture Fund — CHATS (Convexity Humanitarian Aid Transfer Solution)
Source: `https://www.unicefventurefund.org/story/chats-transparent-digital-cash-and-voucher-transfer-beneficiaries-through-blockchain` (story dated 31 January 2023; HTTP 200, full article fetched).

- **Establishes:** Blockchain smart contracts for direct digital cash/voucher transfer to refugees, IDPs and vulnerable households; donor dashboard with "bird's-eye view" of recipient use; verified beneficiary wallets; **geo-fencing** to prevent disbursement outside authorised locations; non-custodial smart-contract fund management where donors can pause or refuse disbursement on suspicion of fraud; stablecoin donations to non-custodial escrow wallets withdrawable under programmable conditions; vendor/agent onboarding and NGO approval; USSD/SMS/QR/paper/NFC claim channels; deployed on Polygon; open source. This is a strong precedent for *programmable, purpose-aware aid disbursement* with merchant involvement.
- **Does not establish:** Nested budget envelopes by programme → expense category → field team; a vendor-signed invoice as the sole agent payment path; a constrained procurement agent acting for a field team. CHATS is beneficiary-facing aid distribution; FIELDRAIL is field-team procurement against approved suppliers. Do **not** claim that nobody has used blockchain for humanitarian disbursement — CHATS disproves that.

### 2.3 Xcapit Shelter — programmable aid and subsidy distribution
Source: `https://www.xcapit.com/en/labs/shelter` (HTTP 200, full product page fetched).

- **Establishes:** End-to-end aid/subsidy distribution: registration by phone number, **rules encoded in smart contracts** (eligibility criteria, distribution schedules, amount thresholds), stablecoins to a non-custodial SMS wallet usable on basic phones, merchant payment or local cash-out; EVM chains (Celo, Polygon, Arbitrum or private networks); page reports pilots in Venezuela, Peru and Kenya, 319 beneficiaries in Peru/Kenya, 100% completion and on-chain settlement in under two minutes; UNICEF Venture Fund and Stellar Development Foundation backing; Digital Public Good recognition; real-time dashboard and audit-ready reporting. Close precedent for *rule-bound stablecoin distribution with merchant redemption*.
- **Does not establish:** Nested purpose-bound allocations across programme/category/team; vendor-signed invoices bound to programme and evidence hash; a narrowly scoped procurement agent as payer. Its 2026 roadmap lists AI fraud detection and self-service portals — an adjacent direction, not the same control mechanism.

### 2.4 Ondo State Project Facilitation Fund financial-management manual — restricted-fund context (partial source)
Source: `https://ondostate.gov.ng/wp-content/uploads/2025/12/Ondo-PFF-Financial-Management-Manual-1.pdf` (HTTP 200; `Content-Length: 1,558,059`; body truncated at 65,294 bytes; `pdftotext` failed).

- **Establishes, at minimum:** A public finance manual titled as an Ondo State PFF Financial Management Manual exists at that URL (header and filename verified). The FIELDRAIL master spec characterises it as describing restricted/designated funds and donor-condition management, but **that characterisation was not independently verified in this workstream** because of the truncated download.
- **Does not establish (verifiably here):** Any blockchain use, any agent payment path, any vendor-signed invoice rule. Treat as contextual evidence that designated-fund workflows exist, not as proof of a uniform process across organisations.

## 3. Strongest overlap and FIELDRAIL's separation statement

**Strongest competitive overlap found:** `https://github.com/dannytungadi5/agentpay-guard` (created 2026-11-25T09:20:02Z). Its README describes a per-agent mandate with total budget, per-payment cap and expiry; a per-agent merchant allowlist; an **optional EIP-712 invoice signed by the merchant** binding merchant, payer, amount, order id and deadline; one-time `orderId` replay protection; a rolling 24-hour limit; an approval threshold for large payments; and a demo in which a poisoned invoice cannot move funds. Alongside it, `ccviolett/aevum-policypay` combines policy-bounded sessions, EIP-712 agent intents and CoP invoice escrow, and `Admuad/Spendguard`, `risingjerry/spendleash-x402`, `deniart865/agentpay-aevum`, `MSAbhishek22/aevum-guard` and `masboyalexandria/aevum-agentpay` all ship caps, allowlists, expiry and revocation for agents. **The "AI agent with on-chain spending limits" space is crowded, and "agent + signed invoice + caps" is no longer unique.**

**FIELDRAIL's wedge, stated narrowly:** a *purpose-bound programme envelope* structure with nested partitions — programme → expense-category envelope → field-team allocation — plus an approved-supplier registry scoped by category, a **vendor-signed invoice** binding programme, field team, category, token, amount, payee, invoice ID, supplier nonce, evidence hash and expiry, and a **constrained agent mandate** scoped to one field team and category with per-invoice and cumulative allowances and expiry. `payInvoice` is the only ordinary agent payment path; every policy check (active agent, mandate scope and caps, supplier approval for the category, category and team remaining balances, programme expiry, invoice/nonce freshness, signature validity) is enforced by the contract before transfer. BLOCKED payments return a specific reason tied to the relevant envelope or mandate.

**Explicitly NOT claimed by FIELDRAIL:**
- a generic stablecoin wallet, checkout page or payment link;
- an x402 HTTP-402 gateway or pay-per-request API billing;
- a spending-limit dashboard or an allowlist-only session-key vault;
- a delivery-verified/proof-of-work escrow that adjudicates whether goods arrived;
- a replacement for FundsChain, CHATS or Shelter, nor any claim that restricted-fund management, blockchain aid disbursement, vendor-signed invoices or capped agent wallets are globally new.

**Is the wedge still distinct?** Yes, but **only on the nested-partition-and-evidence dimension**, not on its individual primitives. Among the public repos inspected (§1), none showed a funded hierarchy of programme/category/field-team envelopes whose remaining balances are checked at payment time together with a vendor-signed invoice carrying a programme/team/category/evidence-hash binding and a team-and-category-scoped agent mandate. `MSAbhishek22/aevum-guard` has flat "category" session scopes; `dannytungadi5/agentpay-guard` has signed invoices but a flat per-agent budget; `ccviolett/aevum-policypay` has per-session budgets and invoice escrow but no nested allocations; `petersfolorunso-png/proofpay` and `Zhee1112/exportflow` gate on delivered proof rather than programme purpose. The combination is therefore still separable, but a judge could reasonably read FIELDRAIL as a variant of the agent-spending-vault category unless the demo makes the *nested invariant* the centrepiece: show a payment rejected because the **North Zone / Water** envelope is exhausted while the programme and other categories still have funds, and show the invoice signature failing when the team, category or evidence hash is altered. Deepen the on-chain mechanism (enforce the hierarchy and evidence binding in `FieldrailProgramVault`, keep the agent's only path `payInvoice`) rather than adding another generic cap, checkout or escrow feature.

## 4. Bottom line

- Crowded: agent spend limits, allowlists, expiry/revoke, invoice checkout, receipt verification, x402 payments, proof/milestone escrow.
- Contested: signed-invoice-as-authorisation and prompt-injection-resistant agent payments (already demonstrated by `agentpay-guard`, `policypay`, `spendleash-x402`, `spendguard`).
- Distinct but narrow: nested purpose-bound budget envelopes + evidence-bound, vendor-signed invoices + team/category-scoped agent mandate. This is the claim to make — described as a *combination tailored to field procurement*, never as global novelty.
