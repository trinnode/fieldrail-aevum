import type { ReactNode } from "react";
import clsx from "clsx";

export function Panel({
  kicker,
  title,
  children,
  className,
  action,
}: {
  kicker?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={clsx("panel p-5 sm:p-6", className)}>
      {(kicker || title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {kicker && <div className="label mb-1">{kicker}</div>}
            {title && <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "accent" | "copper" }) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "copper" ? "text-copper" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-[#fbfaf7] px-4 py-3">
      <div className="label">{label}</div>
      <div className={clsx("num mt-1 text-[22px] leading-none", toneClass)}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-inksoft">{sub}</div>}
    </div>
  );
}

export function Meter({ spent, cap, label }: { spent: bigint; cap: bigint; label?: string }) {
  const pct = cap === 0n ? 0 : Math.min(100, Number((spent * 10000n) / cap) / 100);
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-inksoft">
          <span>{label}</span>
          <span className="num">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8eae4]">
        <div
          className={clsx("h-full rounded-full transition-[width] duration-500", pct > 85 ? "bg-copper" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusChip({ status }: { status: "Active" | "Paused" | "Closed" }) {
  const tone = status === "Active" ? "text-positive" : status === "Paused" ? "text-copper" : "text-danger";
  return (
    <span className={clsx("chip", tone)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "danger" | "ok"; children: ReactNode }) {
  const styles = {
    info: "border-line bg-[#fbfaf7] text-inksoft",
    warn: "border-copper/40 bg-copper/5 text-[#7a4a22]",
    danger: "border-danger/40 bg-danger/5 text-[#7d2d29]",
    ok: "border-accent/40 bg-accent/5 text-accentdeep",
  }[tone];
  return <div className={clsx("rounded-xl border px-4 py-3 text-sm leading-relaxed", styles)}>{children}</div>;
}
