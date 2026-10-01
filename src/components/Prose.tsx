import type { Section } from "@/content/types";

export function Prose({ body }: { body: Section[] }) {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-ink/85">
      {body.map((s, i) => (
        <section key={i} className="space-y-3">
          {s.h && <h2 className="font-display text-xl font-bold text-ink">{s.h}</h2>}
          {s.p?.map((t, j) => <p key={j}>{t}</p>)}
          {s.list && (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-signal">
              {s.list.map((t, j) => <li key={j}>{t}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
