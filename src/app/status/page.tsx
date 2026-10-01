import Link from "next/link";
import { STATUS } from "@/lib/status";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Status screens");

// Internal gallery of every state screen, for design review and QA.
export default function StatusGallery() {
  const extra: [string, string][] = [
    ["/status/loading", "Loading (global)"],
    ["/offline", "Offline"],
    ["/maintenance", "Maintenance (503)"],
    ["/lots/this-lot-does-not-exist", "Lot not found"],
    ["/this-page-does-not-exist", "Page not found"],
    ["/login?expired=1", "Session expired banner"],
  ];
  return (
    <div className="container-pp py-10">
      <h1 className="font-display text-3xl font-bold">State & status screens</h1>
      <p className="mb-8 text-muted">Preview every loading, empty, error and HTTP status screen. Not linked from the public site.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(STATUS).map(([code, s]) => (
          <Link key={code} href={`/status/${code}`} className="card p-4">
            <p className="font-display text-2xl font-bold text-signal">{code}</p>
            <p className="text-sm font-semibold">{s.title}</p>
          </Link>
        ))}
        {extra.map(([href, label]) => (
          <Link key={href} href={href} className="card p-4">
            <p className="font-display text-sm font-bold text-muted">Screen</p>
            <p className="text-sm font-semibold">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
