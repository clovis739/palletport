export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect x="4" y="4" width="11" height="10" rx="1.5" fill="currentColor" />
        <rect x="17" y="4" width="11" height="10" rx="1.5" fill="#f0641e" />
        <rect x="4" y="16" width="24" height="5" rx="1.5" fill="currentColor" />
        <rect x="5" y="23" width="4" height="5" fill="currentColor" />
        <rect x="14" y="23" width="4" height="5" fill="currentColor" />
        <rect x="23" y="23" width="4" height="5" fill="currentColor" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">
        Pallet<span className="text-signal">Port</span>
      </span>
    </span>
  );
}
