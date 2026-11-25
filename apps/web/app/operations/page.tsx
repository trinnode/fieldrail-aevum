"use client";

import { useMemo, useState } from "react";
import { bytes32, shortHex, type Invoice } from "@fieldrail/shared-types";
import {
  explainError,
  formatAmount,
  invoiceMessage,
  invoiceTuple,
  invoiceTypes,
  parseAmount,
  vaultAbi,
} from "@fieldrail/contracts-client";
import { aevumChain, DEMO_SUPPLIER_ADDRESS, DEMO_AGENT_ADDRESS, DEMO_VAULT_ADDRESS, isConfigured, txUrl } from "@fieldrail/chain-config";
import { DataModeBanner } from "@/components/demo-banner";
import { Notice, Panel, StatusChip } from "@/components/ui";
import { fieldrailChain, useChain } from "@/lib/chain-provider";
import { useProgramme } from "@/lib/use-programme";
import { CATEGORIES, TEAMS, PROGRAMME_ID } from "@/lib/constants";
import { firstFailure, validateInvoice } from "@/lib/policy";

const DAY = 86_400n;

export default function OperationsPage() {
  const { snapshot, refresh } = useProgramme();
  const { walletClient, publicClient, account, ensureChain } = useChain();
  const live = isConfigured(DEMO_VAULT_ADDRESS);

  const [amount, setAmount] = useState("18");
  const [teamIndex, setTeamIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [supplier, setSupplier] = useState<string>(DEMO_SUPPLIER_ADDRESS);
  const [invoiceId, setInvoiceId] = useState("INV-001");
  const [nonce, setNonce] = useState("1");
  const [evidence, setEvidence] = useState("borehole-07-quote");
  const [deadlineDays, setDeadlineDays] = useState("2");
  const [signature, setSignature] = useState<`0x${string}` | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "danger" | "info"; text: string; hash?: string } | null>(null);

  const invoice = useMemo<Invoice>(() => {
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(Number(deadlineDays || "1")) * DAY;
    return {
      programmeId: PROGRAMME_ID,
      invoiceId: bytes32(invoiceId || "INV-001"),
      teamId: TEAMS[teamIndex].id,
      categoryId: CATEGORIES[categoryIndex].id,
      supplier: (supplier || DEMO_SUPPLIER_ADDRESS) as `0x${string}`,
      token: (process.env.NEXT_PUBLIC_TUSD8_ADDRESS ?? "0x456569838f1d43009A91ebA4263147Afd7233483") as `0x${string}`,
      amount: (() => { try { return parseAmount(amount || "0"); } catch { return 0n; } })(),
      evidenceHash: bytes32(evidence || "evidence"),
      nonce: BigInt(nonce || "0"),
      deadline,
    };
  }, [amount, teamIndex, categoryIndex, supplier, invoiceId, nonce, evidence, deadlineDays]);

  const checks = useMemo(() => validateInvoice(invoice, snapshot), [invoice, snapshot]);
  const failure = firstFailure(checks);

  async function sign() {
    setResult(null);
    if (!walletClient || !account) {
      setResult({ tone: "danger", text: "Connect the supplier wallet before signing. In demo mode signing is unavailable." });
      return;
    }
    if (!(await ensureChain())) return;
    setBusy(true);
    try {
      const domain = {
        name: "FieldrailProgramVault",
        version: "1",
        chainId: aevumChain.id,
        verifyingContract: DEMO_VAULT_ADDRESS,
      } as const;
      const sig = await walletClient.signTypedData({
        account,
        domain,
        types: invoiceTypes,
        primaryType: "Invoice",
        message: invoiceMessage(invoice),
      });
      setSignature(sig);
      setResult({ tone: "ok", text: "Supplier signature captured. The digest binds chain ID and this vault address." });
    } catch (e) {
      setResult({ tone: "danger", text: explainError(e).message });
    } finally {
      setBusy(false);
    }
  }

  async function simulate(target: Invoice = invoice) {
    setResult(null);
    if (!live) {
      setResult({ tone: "info", text: "Local deterministic policy check complete — no RPC call was made in demo mode." });
      return;
    }
    setBusy(true);
    try {
      await publicClient.simulateContract({
        address: DEMO_VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "payInvoice",
        args: [invoiceMessage(target), signature ?? "0x"],
        account: DEMO_AGENT_ADDRESS,
      });
      setResult({ tone: "ok", text: "eth_call simulation succeeded: the contract would accept this invoice." });
    } catch (e) {
      const explanation = explainError(e);
      setResult({ tone: "danger", text: `Blocked by contract (${explanation.code}): ${explanation.message}` });
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setResult(null);
    if (!live || !walletClient || !account || !signature) {
      setResult({ tone: "danger", text: "Live vault, connected agent wallet and supplier signature are all required." });
      return;
    }
    if (!(await ensureChain())) return;
    setBusy(true);
    try {
      const hash = await walletClient.writeContract({
        address: DEMO_VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "payInvoice",
        args: [invoiceMessage(invoice), signature],
        account,
        chain: fieldrailChain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        setResult({ tone: "ok", text: `Payment confirmed in block ${receipt.blockNumber}.`, hash });
        refresh();
      } else {
        setResult({ tone: "danger", text: "Transaction reverted on-chain.", hash });
      }
    } catch (e) {
      const explanation = explainError(e);
      setResult({ tone: "danger", text: `Rejected (${explanation.code}): ${explanation.message}` });
    } finally {
      setBusy(false);
    }
  }

  function preset(kind: "unapproved" | "exhausted" | "replay") {
    setResult(null);
    setSignature(null);
    const override: Invoice = { ...invoice };
    setCategoryIndex(0);
    setTeamIndex(0);
    override.categoryId = CATEGORIES[0].id;
    override.teamId = TEAMS[0].id;

    if (kind === "unapproved") {
      const vendor = "0x3333333333333333333333333333333333333333" as `0x${string}`;
      setSupplier(vendor);
      setAmount("18");
      override.supplier = vendor;
      override.amount = 18_000_000n;
    } else if (kind === "exhausted") {
      setSupplier(DEMO_SUPPLIER_ADDRESS);
      setAmount("999");
      override.supplier = DEMO_SUPPLIER_ADDRESS;
      override.amount = 999_000_000n;
    } else {
      setSupplier(DEMO_SUPPLIER_ADDRESS);
      setAmount("18");
      setNonce("1");
      setInvoiceId("INV-001");
      override.supplier = DEMO_SUPPLIER_ADDRESS;
      override.amount = 18_000_000n;
      override.nonce = 1n;
      override.invoiceId = bytes32("INV-001");
    }
    void simulate(override);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Field operations</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Invoice → policy → payment
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-inksoft">
          Build a supplier-signed invoice, run the deterministic policy preflight, then simulate or submit the exact
          <code className="num mx-1">payInvoice</code> call. The checklist explains; the contract decides.
        </p>
      </div>

      <DataModeBanner />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel kicker="Step 1" title="Draft invoice">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Field team">
              <select className="input" value={teamIndex} onChange={(e) => setTeamIndex(Number(e.target.value))}>
                {TEAMS.map((t, i) => <option key={t.id} value={i}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Expense category">
              <select className="input" value={categoryIndex} onChange={(e) => setCategoryIndex(Number(e.target.value))}>
                {CATEGORIES.map((c, i) => <option key={c.id} value={i}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Amount (tUSD8)">
              <input className="input num" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Supplier wallet">
              <input className="input num text-xs" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </Field>
            <Field label="Invoice ID">
              <input className="input num" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} />
            </Field>
            <Field label="Supplier nonce">
              <input className="input num" value={nonce} onChange={(e) => setNonce(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Evidence reference">
              <input className="input" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
            </Field>
            <Field label="Deadline (days from now)">
              <input className="input num" value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-quiet text-sm" disabled={busy} onClick={() => void sign()}>
              {signature ? "Re-sign as supplier" : "Sign as supplier"}
            </button>
            <button className="btn-quiet text-sm" disabled={busy} onClick={() => void simulate()}>
              Simulate payment (eth_call)
            </button>
            <button className="btn-primary text-sm moving-border" disabled={busy || !signature || Boolean(failure)} onClick={() => void submit()}>
              Submit on-chain payment
            </button>
          </div>
          <div className="mt-4 text-xs text-muted">
            Signed fields: programmeId, invoiceId, teamId, categoryId, supplier, token, amount, evidenceHash, nonce, deadline.
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel kicker="Step 2" title="Deterministic policy preflight">
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.id} className="flex gap-3 rounded-lg border border-line px-3 py-2">
                  <span className={`mt-0.5 text-sm ${c.ok ? "text-positive" : "text-danger"}`}>{c.ok ? "✓" : "✕"}</span>
                  <div>
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-inksoft">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <StatusChip status={failure ? "Paused" : "Active"} />
              <span className="ml-2 text-xs text-inksoft">
                {failure ? `Preflight blocked: ${failure.detail}` : "All local checks pass. Contract re-checks everything."}
              </span>
            </div>
          </Panel>

          <Panel kicker="Step 3" title="Result">
            {result ? (
              <Notice tone={result.tone}>
                {result.text}
                {result.hash && (
                  <div className="mt-2">
                    <a className="num underline underline-offset-4" href={txUrl(result.hash)} target="_blank" rel="noreferrer">
                      {shortHex(result.hash, 12, 8)} ↗ Aevum explorer
                    </a>
                  </div>
                )}
              </Notice>
            ) : (
              <Notice tone="info">No action yet. Sign the invoice, simulate, then submit if all checks pass.</Notice>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-line p-3">
                <div className="label">Signature</div>
                <div className="num mt-1">{signature ? shortHex(signature, 8, 6) : "not captured"}</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label">Agent</div>
                <div className="num mt-1">{shortHex(DEMO_AGENT_ADDRESS)}</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label">Amount</div>
                <div className="num mt-1">{formatAmount(invoice.amount)} tUSD8</div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <div className="label">Vault</div>
                <div className="num mt-1">{live ? shortHex(DEMO_VAULT_ADDRESS) : "demo"}</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel kicker="Mandatory negative cases" title="Blocked-payment explanations" className="scroll-mt-32" action={<span id="blocked" />}>
        <p className="mb-4 text-sm text-inksoft">
          Each preset rewrites the draft and runs the exact contract call through <code className="num">eth_call</code> in
          live mode. A denial is a real revert, not a hidden UI button.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <button className="btn-quiet text-left text-sm" disabled={busy} onClick={() => preset("unapproved")}>
            <strong>Unapproved vendor</strong>
            <span className="mt-1 block text-xs text-inksoft">Water mandate → vendor not approved for water.</span>
          </button>
          <button className="btn-quiet text-left text-sm" disabled={busy} onClick={() => preset("exhausted")}>
            <strong>Exhausted envelope</strong>
            <span className="mt-1 block text-xs text-inksoft">Request exceeds North Zone / Water remaining budget.</span>
          </button>
          <button className="btn-quiet text-left text-sm" disabled={busy} onClick={() => preset("replay")}>
            <strong>Invoice replay</strong>
            <span className="mt-1 block text-xs text-inksoft">Reuse invoice ID and supplier nonce.</span>
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
