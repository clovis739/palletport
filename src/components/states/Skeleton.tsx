// Loading skeletons. Pure CSS (animate-pulse) so they render instantly from loading.tsx.

export function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}

export function SkText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => <Sk key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />)}
    </div>
  );
}

export function SkLotCard() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <Sk className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex justify-between"><Sk className="h-4 w-20 rounded-full" /><Sk className="h-3 w-16" /></div>
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-3/4" />
        <div className="flex items-end justify-between pt-1"><Sk className="h-6 w-24" /><Sk className="h-4 w-14" /></div>
        <div className="flex justify-between pt-2"><Sk className="h-3 w-12" /><Sk className="h-3 w-16" /></div>
      </div>
    </div>
  );
}

export function SkGrid({ count = 8, cols = "sm:grid-cols-2 lg:grid-cols-4" }: { count?: number; cols?: string }) {
  return <div className={`grid gap-5 ${cols}`}>{Array.from({ length: count }, (_, i) => <SkLotCard key={i} />)}</div>;
}

export function SkTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="flex gap-4 bg-sand/60 px-4 py-3">{[1, 2, 3, 4].map((i) => <Sk key={i} className="h-3 flex-1" />)}</div>
      <div >
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">{[1, 2, 3, 4].map((j) => <Sk key={j} className="h-3 flex-1" />)}</div>
        ))}
      </div>
    </div>
  );
}

export function LoadingLabel({ text = "Loading" }: { text?: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">{text}…</p>
  );
}
