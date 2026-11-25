import { formatAmount } from "@fieldrail/contracts-client";

/**
 * Meaningful visual metaphor: one funded programme splits into bounded category
 * envelopes, each allocated to field teams, then converges on approved vendors.
 * Pure SVG — no WebGL, no blocking paint, keyboard/reduced-motion safe.
 */
export function AllocationRail({ funded = 1_000_000_000n }: { funded?: bigint }) {
  const rows = [
    { y: 78, label: "Water procurement", amount: "450.00", tone: "#1f6b54" },
    { y: 168, label: "Transport & logistics", amount: "250.00", tone: "#3d8570" },
    { y: 258, label: "Field supplies", amount: "200.00", tone: "#6ba28f" },
    { y: 330, label: "Unallocated reserve", amount: "100.00", tone: "#ab6a33" },
  ];

  return (
    <svg
      viewBox="0 0 920 380"
      role="img"
      aria-label={`Allocation rail: ${formatAmount(funded)} tUSD8 programme funding split into category envelopes and approved supplier routes`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="railFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#12202e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#12202e" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* funder boundary */}
      <rect x="18" y="46" width="4" height="290" rx="2" fill="#12202e" opacity="0.75" />
      <text x="18" y="30" className="fill-inksoft text-[11px] font-semibold tracking-[0.16em]">
        SPONSOR
      </text>

      {/* programme node */}
      <rect x="44" y="150" width="176" height="84" rx="14" fill="#12202e" />
      <text x="62" y="178" fill="#f6f3ee" fontSize="12" letterSpacing="1.4" opacity="0.7">
        PROGRAMME VAULT
      </text>
      <text x="62" y="210" fill="#ffffff" fontSize="27" fontFamily="Chivo Mono, monospace">
        {formatAmount(funded)}
      </text>
      <text x="200" y="210" fill="#9fb6a9" fontSize="11">tUSD8</text>

      {/* category envelopes */}
      {rows.map((row) => (
        <g key={row.y}>
          <path
            d={`M220 192 C 300 192, 300 ${row.y}, 372 ${row.y}`}
            fill="none"
            stroke="url(#railFade)"
            strokeWidth="2"
          />
          <rect x="372" y={row.y - 22} width="214" height="44" rx="10" fill="#ffffff" stroke="#dfe3dd" />
          <rect x="372" y={row.y - 22} width="4" height="44" rx="2" fill={row.tone} />
          <text x="388" y={row.y - 3} fill="#12202e" fontSize="13" fontWeight="600">
            {row.label}
          </text>
          <text x="388" y={row.y + 14} fill="#7b8896" fontSize="11" fontFamily="Chivo Mono, monospace">
            cap {row.amount} tUSD8
          </text>
        </g>
      ))}

      {/* team allocations + approved vendor routes */}
      <path d="M586 78 C 650 78, 650 124, 706 124" fill="none" stroke="#1f6b54" strokeWidth="1.6" opacity="0.6" />
      <path d="M586 168 C 650 168, 650 190, 706 190" fill="none" stroke="#3d8570" strokeWidth="1.6" opacity="0.6" />
      <path d="M586 258 C 650 258, 650 256, 706 256" fill="none" stroke="#6ba28f" strokeWidth="1.6" opacity="0.6" />
      <path d="M586 330 C 650 330, 650 322, 706 322" fill="none" stroke="#ab6a33" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.55" />

      {[
        { y: 124, label: "North Zone → approved water supplier", tone: "#1f6b54" },
        { y: 190, label: "North Zone → approved carrier", tone: "#3d8570" },
        { y: 256, label: "North Zone → approved supplier", tone: "#6ba28f" },
        { y: 322, label: "Held pending sponsor decision", tone: "#ab6a33" },
      ].map((row) => (
        <g key={row.y}>
          <rect x="706" y={row.y - 18} width="196" height="36" rx="9" fill="#fbfaf7" stroke="#dfe3dd" />
          <circle cx="724" cy={row.y} r="4" fill={row.tone} />
          <text x="738" y={row.y + 4} fill="#4b5b70" fontSize="11.5">
            {row.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
