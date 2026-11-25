"use client";

import { isConfigured, DEMO_VAULT_ADDRESS } from "@fieldrail/chain-config";
import { Notice } from "./ui";

export function DataModeBanner() {
  const live = isConfigured(DEMO_VAULT_ADDRESS);
  if (live) {
    return (
      <Notice tone="ok">
        <strong>Live on-chain mode.</strong> Figures below are read from the configured programme vault on Aevum. All
        programme names, vendors and teams are still synthetic test labels.
      </Notice>
    );
  }
  return (
    <Notice tone="warn">
      <strong>Synthetic demo data — no on-chain transactions.</strong> Configure{" "}
      <code className="num">NEXT_PUBLIC_PROGRAM_VAULT_ADDRESS</code> in{" "}
      <code className="num">.env.local</code> to switch this interface to real Aevum contract reads. Nothing on this page
      is a settled payment.
    </Notice>
  );
}
