"use client";

import { useEffect, useState } from "react";
import {
  aevumChain,
  TUSD8_ADDRESS,
  FACTORY_ADDRESS,
  DEMO_VAULT_ADDRESS,
  addressUrl,
  isConfigured,
} from "@fieldrail/chain-config";
import { erc20Abi } from "@fieldrail/contracts-client";
import { shortHex } from "@fieldrail/shared-types";
import { Notice, Panel, Stat } from "@/components/ui";
import { useChain } from "@/lib/chain-provider";

export default function SettingsPage() {
  const { publicClient, chainId } = useChain();
  const [rpc, setRpc] = useState<{ ok: boolean; block?: bigint; chainId?: number; error?: string }>({ ok: false });
  const [token, setToken] = useState<{ name?: string; symbol?: string; decimals?: number; error?: string }>({});

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const [block, id] = await Promise.all([publicClient.getBlockNumber(), publicClient.getChainId()]);
        if (!cancelled) setRpc({ ok: true, block, chainId: id });
      } catch (e) {
        if (!cancelled) setRpc({ ok: false, error: e instanceof Error ? e.message : "RPC unreachable" });
      }
      try {
        const [name, symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: TUSD8_ADDRESS, abi: erc20Abi, functionName: "name" }),
          publicClient.readContract({ address: TUSD8_ADDRESS, abi: erc20Abi, functionName: "symbol" }),
          publicClient.readContract({ address: TUSD8_ADDRESS, abi: erc20Abi, functionName: "decimals" }),
        ]);
        if (!cancelled) setToken({ name, symbol, decimals });
      } catch (e) {
        if (!cancelled) setToken({ error: e instanceof Error ? e.message : "Token metadata unavailable" });
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  const addresses: [string, string][] = [
    ["tUSD8 token", TUSD8_ADDRESS],
    ["Fieldrail factory", FACTORY_ADDRESS],
    ["Demo programme vault", DEMO_VAULT_ADDRESS],
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Deployment diagnostics</div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Chain, RPC and contract status
        </h1>
        <p className="mt-2 text-sm text-inksoft">Everything shown here is queried live from the configured RPC.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Expected chain ID" value={String(aevumChain.id)} sub="0xABE5" />
        <Stat label="Wallet chain ID" value={chainId ? String(chainId) : "—"} sub="Injected provider" />
        <Stat label="RPC chain ID" value={rpc.chainId ? String(rpc.chainId) : "—"} sub={rpc.ok ? "reachable" : "unreachable"} />
        <Stat label="Latest block" value={rpc.block ? rpc.block.toString() : "—"} sub={rpc.error ?? "HTTPS polling"} />
      </section>

      {!rpc.ok && <Notice tone="danger">RPC error: {rpc.error ?? "unknown"}. The app will show labelled synthetic data until the endpoint responds.</Notice>}
      {rpc.ok && rpc.chainId !== aevumChain.id && (
        <Notice tone="warn">RPC chain ID does not match the expected Aevum testnet ID. Do not trust displayed values.</Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel kicker="Token" title="tUSD8 metadata">
          {token.error ? (
            <Notice tone="danger">{token.error}</Notice>
          ) : (
            <dl className="divide-y divide-line text-sm">
              {[
                ["Name", token.name ?? "—"],
                ["Symbol", token.symbol ?? "—"],
                ["Decimals", token.decimals === undefined ? "—" : String(token.decimals)],
                ["Address", shortHex(TUSD8_ADDRESS)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-inksoft">{k}</dt>
                  <dd className="num text-right text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {token.decimals !== undefined && token.decimals !== 6 && (
            <Notice tone="danger">Decimals are not 6. Do not sign invoices until this is resolved.</Notice>
          )}
        </Panel>

        <Panel kicker="Registry" title="Configured addresses">
          <div className="space-y-3">
            {addresses.map(([label, address]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="num text-[11px] text-muted">{isConfigured(address) ? shortHex(address, 12, 8) : "not configured"}</div>
                </div>
                {isConfigured(address) && (
                  <a className="text-xs text-accent underline underline-offset-4" href={addressUrl(address)} target="_blank" rel="noreferrer">
                    explorer ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted">
            RPC: <span className="num">{aevumChain.rpcUrl}</span>
            <br />
            Explorer: <span className="num">{aevumChain.explorerUrl}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
