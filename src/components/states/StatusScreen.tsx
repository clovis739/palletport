import Link from "next/link";
import { statusCopy } from "@/lib/status";

type Action = { href: string; label: string; primary?: boolean };

const TONE = {
  info: "text-signal",
  warn: "text-amber-600",
  error: "text-rust",
};

/** Full-page state used by 4xx/5xx screens, error boundaries and maintenance. */
export function StatusScreen({
  code,
  title,
  message,
  actions,
  children,
  showCode = true,
  artLabel,
}: {
  code: number;
  title?: string;
  message?: string;
  actions?: Action[];
  children?: React.ReactNode;
  showCode?: boolean;
  artLabel?: string;
}) {
  const copy = statusCopy(code);
  const acts = actions ?? [
    { href: "/", label: "Go to homepage", primary: true },
    { href: "/lots", label: "Shop all lots" },
  ];
  return (
    <div className="container-pp grid min-h-[60vh] place-items-center py-10 sm:py-16">
      <div className="max-w-xl text-center">
        <StackArt code={artLabel ?? code} mood={artLabel === "OFF" ? "float" : moodFor(code)} />
        {showCode && <p className={`mt-6 font-display text-sm font-bold uppercase tracking-[0.2em] ${TONE[copy.tone]}`}>Error {code}</p>}
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title ?? copy.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/70">{message ?? copy.message}</p>
        {children}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {acts.map((a) => (
            <Link key={a.href + a.label} href={a.href} className={a.primary ? "btn-primary" : "btn-ghost"}>{a.label}</Link>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          Need help? <Link href="/help" className="font-semibold text-signal-dark hover:underline">Help center</Link> · <Link href="/contact" className="font-semibold text-signal-dark hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

type ArtMood = "tip" | "shake" | "float";

/** 4xx: the top box teeters · 5xx: the stack shudders · maintenance/offline (503, OFF): the top box hovers. */
function moodFor(code: number | string): ArtMood {
  const n = typeof code === "number" ? code : Number(code);
  if (code === "OFF" || n === 503) return "float";
  if (n >= 500) return "shake";
  return "tip";
}

/**
 * A small, original pallet illustration whose top box shows the status code. Animated with CSS
 * (see `.pp-art` in globals.css): the boxes drop onto the pallet, then a gentle loop that matches the
 * kind of error. Everything stays still for visitors who prefer reduced motion.
 */
export function StackArt({ code, mood }: { code: number | string; mood?: ArtMood }) {
  const m = mood ?? moodFor(code);
  return (
    <svg viewBox="0 0 220 140" className={`pp-art pp-art-${m} mx-auto h-32 w-auto overflow-visible`} role="img" aria-hidden>
      <ellipse className="pp-art-shadow" cx="110" cy="130" rx="92" ry="6" fill="#e3dac6" />
      <g className="pp-art-base">
        <rect x="28" y="112" width="164" height="6" fill="#b9864f" />
        <rect x="34" y="118" width="14" height="10" fill="#9c6c3b" />
        <rect x="103" y="118" width="14" height="10" fill="#9c6c3b" />
        <rect x="172" y="118" width="14" height="10" fill="#9c6c3b" />
      </g>
      <g className="pp-art-box pp-art-box-1">
        <rect x="34" y="78" width="72" height="34" rx="2" fill="#d9c3a0" />
        <rect x="66" y="78" width="8" height="34" fill="#bda27a" opacity=".6" />
      </g>
      <g className="pp-art-box pp-art-box-2">
        <rect x="110" y="78" width="76" height="34" rx="2" fill="#cfb690" />
        <rect x="144" y="78" width="8" height="34" fill="#bda27a" opacity=".6" />
      </g>
      <g className="pp-art-top">
        <g transform="rotate(-8 110 55)">
          <rect x="62" y="30" width="96" height="46" rx="3" fill="#13233f" />
          <text x="110" y="62" textAnchor="middle" fontFamily="var(--font-grotesk), sans-serif" fontWeight="700" fontSize="26" fill="#f0641e">{code}</text>
        </g>
      </g>
    </svg>
  );
}
