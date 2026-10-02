"use client";

// Last-resort boundary: replaces the root layout, so it must render its own <html> and styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbf8f1", color: "#13233f" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b3371f", fontSize: 13 }}>Error 500</p>
            <h1 style={{ fontSize: "clamp(24px, 7vw, 32px)", margin: "8px 0" }}>We&apos;re having trouble loading the site</h1>
            <p style={{ color: "#6a6454" }}>A critical error stopped the site from loading. Please try again. If you were placing an order, check Orders afterwards.</p>
            {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6a6454" }}>Reference: {error.digest}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button onClick={() => reset()} style={{ background: "#f0641e", color: "#fff", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" style={{ background: "#f4f5f7", borderRadius: 999, padding: "10px 20px", fontWeight: 600, color: "#13233f", textDecoration: "none" }}>Homepage</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
