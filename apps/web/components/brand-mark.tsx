export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" role="img" aria-label="FIELDRAIL mark" className={className}>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M8 14V50" />
        <path d="M8 18H32L40 32" />
        <path d="M8 32H40" />
        <path d="M8 46H32L40 32" />
        <path d="M48 24L56 32L48 40L40 32Z" />
      </g>
      <circle cx="48" cy="32" r="2.6" fill="currentColor" />
    </svg>
  );
}
