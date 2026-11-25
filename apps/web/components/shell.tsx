"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import clsx from "clsx";
import { ConnectButton } from "./connect-button";
import { aevumChain } from "@fieldrail/chain-config";

const NAV = [
  { href: "/", label: "Overview", icon: "◧" },
  { href: "/programme", label: "Programme", icon: "▤" },
  { href: "/operations", label: "Field ops", icon: "⇢" },
  { href: "/supplier", label: "Invoice", icon: "▣" },
  { href: "/agents", label: "Mandates", icon: "⌁" },
  { href: "/audit", label: "Audit", icon: "≡" },
  { href: "/settings", label: "Diagnostics", icon: "◇" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center gap-5 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/fieldrail-mark.svg" alt="" className="h-7 w-7 text-accent" />
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[0.18em]">FIELDRAIL</span>
          </Link>
          <span className="hidden border-l border-line pl-4 text-xs text-muted lg:block">
            Programme disbursement infrastructure
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] text-muted sm:block">Aevum testnet · {aevumChain.id}</span>
            <ConnectButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-3 pb-2 sm:px-6">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active ? "bg-ink text-white" : "text-inksoft hover:bg-black/5 hover:text-ink",
                )}
              >
                <span className="mr-1.5 opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-[1320px] px-5 pb-24 pt-8 sm:px-8">{children}</main>
      <footer className="border-t border-line px-6 py-8 text-center text-xs text-muted">
        FIELDRAIL · Purpose in every payment · Testnet prototype. All programmes, vendors and balances shown are synthetic test data.
      </footer>
    </div>
  );
}
