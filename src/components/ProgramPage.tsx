import { FaqAccordion } from "@/components/content/FaqAccordion";
import { InquiryForm } from "./InquiryForm";
import { JsonLd } from "./JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { getBrand } from "@/lib/brand";
import { rebrandDeep } from "@/lib/settings-schema";

type Topic = "PRO" | "VOLUME" | "AFFILIATE" | "EVENTS" | "INTEGRATIONS";

function ProgramPageView({
  eyebrow,
  title,
  lead,
  hue,
  benefits,
  steps,
  faqs,
  topic,
  formTitle,
  formCta,
  bodyLabel,
  extra,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  hue: number;
  benefits: [string, string][];
  steps?: string[];
  faqs?: [string, string][];
  topic: Topic;
  formTitle: string;
  formCta: string;
  bodyLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <>
      {faqs && <JsonLd data={faqJsonLd(faqs.map(([q, a]) => ({ q, a })))} />}
      <section className="text-white" style={{ background: `hsl(${hue} 45% 22%)` }}>
        <div className="container-pp grid grid-cols-1 gap-8 py-10 sm:py-16 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-signal">{eyebrow}</p>
            <h1 className="mt-2 break-words font-display text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-xl text-white/75">{lead}</p>
          </div>
          <div className="min-w-0 rounded-2xl bg-white/10 p-5 sm:p-6">
            <p className="mb-4 font-display text-lg font-bold">{formTitle}</p>
            <InquiryForm topic={topic} dark submitLabel={formCta} bodyLabel={bodyLabel ?? "Tell us about your business"} />
          </div>
        </div>
      </section>
      <section className="container-pp py-10 sm:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([t, d]) => (
            <div key={t} className="card p-5">
              <p className="font-display text-lg font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
        {extra}
        {steps && (
          <div className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-bold">How it works</h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-3 rounded-2xl bg-sand/70 p-5">
                  <span className="font-display text-2xl font-bold text-signal">{i + 1}</span>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {faqs && (
          <div className="mt-14 max-w-3xl">
            <h2 className="mb-4 font-display text-2xl font-bold">Questions</h2>
            <FaqAccordion items={faqs.map(([q, a]) => ({ q, a }))} defaultOpen={null} className="" />
          </div>
        )}
      </section>
    </>
  );
}

/** Program pages (Pro, Volume buyers, Affiliates, Events, Integrations): text follows the business name. */
export async function ProgramPage(props: Parameters<typeof ProgramPageView>[0]) {
  return <ProgramPageView {...rebrandDeep(props, await getBrand())} />;
}
