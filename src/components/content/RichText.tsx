import Link from "next/link";
import type { ReactNode } from "react";

// [label](/path) | [label](https://…) | **bold**
const TOKEN = /\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]*)\)|\*\*([^*]+)\*\*/g;
const LINK = "font-semibold text-signal-dark underline decoration-signal/40 underline-offset-2 hover:decoration-signal";

/**
 * Renders inline content markup: `[label](/path)` links (internal paths use next/link, external open with
 * rel=noopener) and `**bold**`. Everything else is plain text (no HTML is ever injected).
 */
export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, label, href, bold] = m;
    if (bold !== undefined) out.push(<strong key={at} className="font-semibold text-ink">{bold}</strong>);
    else if (href.startsWith("/")) out.push(<Link key={at} href={href} className={LINK}>{label}</Link>);
    else out.push(<a key={at} href={href} className={LINK} rel="noopener">{label}</a>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
