"use client";

import { useState } from "react";
import { useChain } from "@/lib/chain-provider";
import { shortHex } from "@fieldrail/shared-types";

export function ConnectButton() {
  const { account, chainId, connect, disconnect, connecting, error, hasProvider } = useChain();
  const [open, setOpen] = useState(false);

  if (account) {
    return (
      <div className="relative">
        <button className="btn-quiet num text-xs" onClick={() => setOpen((v) => !v)}>
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          {shortHex(account, 6, 4)}
        </button>
        {open && (
          <div className="panel absolute right-0 z-30 mt-2 w-64 p-4 text-sm">
            <div className="label mb-2">Connected wallet</div>
            <div className="num break-all text-xs">{account}</div>
            <div className="mt-3 flex justify-between text-xs text-inksoft">
              <span>Chain ID</span>
              <span className="num">{chainId ?? "—"}</span>
            </div>
            <button
              className="btn-quiet mt-4 w-full text-xs"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button className="btn-primary text-sm" disabled={connecting || !hasProvider} onClick={() => void connect()}>
        {connecting ? "Connecting…" : hasProvider ? "Connect wallet" : "No wallet detected"}
      </button>
      {error && <span className="max-w-[260px] text-right text-[11px] text-danger">{error}</span>}
    </div>
  );
}
