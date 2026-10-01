"use client";

import { Bot, Info } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { FormSection } from "@/components/admin/FormField";
import { resolveImageRef } from "@/lib/imageRef";
import { photoSrc } from "@/content/photos";
import { saveSeo } from "@/app/actions/site";
import type { SeoSettings } from "@/lib/settings-schema";
import { SettingsForm } from "../_components/SettingsForm";
import { MediaField, Text } from "../_components/fields";

function Preview({ s, host }: { s: SeoSettings; host: string }) {
  const sample = s.titleTemplate.includes("%s") ? s.titleTemplate.replace("%s", "Pallets") : s.titleTemplate;
  const r = resolveImageRef(s.ogImage);
  const img = r.kind === "stock" ? photoSrc(r.photo, 600, 1200 / 630) : r.kind === "url" ? r.src : "";
  return (
    <>
      <div>
        <p className="label">Search result preview</p>
        <div className="card space-y-1 p-4">
          <p className="truncate text-xs text-ink/70">{host}</p>
          <p className="line-clamp-2 text-lg leading-snug text-[#1a0dab]">{s.defaultTitle || "Your homepage title"}</p>
          <p className="line-clamp-2 text-sm text-ink/75">{s.defaultDescription || "Your description appears here."}</p>
        </div>
        <p className="mt-2 text-xs text-muted">
          Other pages: <span className="font-semibold text-ink">{sample}</span>
        </p>
      </div>
      <div>
        <p className="label">Social share preview</p>
        <div className="card overflow-hidden">
          <div className="grid aspect-[1200/630] place-items-center bg-ink text-white/70">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-center text-xs">Generated image with your logo and name</span>
            )}
          </div>
          <div className="space-y-0.5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">{host}</p>
            <p className="line-clamp-1 text-sm font-semibold">{s.defaultTitle}</p>
            <p className="line-clamp-2 text-xs text-muted">{s.defaultDescription}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function SeoForm({ initial, host, aiAllowed }: { initial: SeoSettings; host: string; aiAllowed: boolean }) {
  return (
    <SettingsForm initial={initial} action={saveSeo} aside={(v) => <Preview s={v} host={host} />}>
      {(f) => (
        <>
          <Card>
            <FormSection title="Titles" description="Search engines show about 60 characters of a title.">
              <Text f={f} path="defaultTitle" label="Default title" max={70} ideal={[30, 60]} required hint="Used for the homepage tab and any page without its own title." />
              <Text f={f} path="titleTemplate" label="Title template" max={60} required hint={<>Every other page: <code className="rounded bg-sand px-1">%s</code> is replaced by the page title, e.g. “%s · PalletPort”.</>} />
            </FormSection>
            <FormSection title="Description" description="The snippet under your title in search results. Aim for 120–160 characters.">
              <Text f={f} path="defaultDescription" label="Default description" rows={3} max={200} ideal={[120, 160]} />
            </FormSection>
            <FormSection title="Social image" description="Shown when a link to your site is shared (Facebook, LinkedIn, WhatsApp, X). Best at 1200×630.">
              <MediaField f={f} path="ogImage" label="Default social image" hint="Leave empty to use the generated image with your logo." />
            </FormSection>
          </Card>

          <Card>
            <div className="flex gap-3">
              <Bot aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  AI crawlers are currently <span className={aiAllowed ? "text-moss" : "text-rust"}>{aiAllowed ? "allowed" : "blocked"}</span>
                </p>
                <p className="mt-1 text-muted">
                  Whether assistants such as ChatGPT, Claude and Perplexity may read your site is set by the server setting{" "}
                  <code className="rounded bg-sand px-1">ALLOW_AI_CRAWLERS</code> (set it to <code className="rounded bg-sand px-1">false</code> to block them in robots.txt). Ask your developer or host to change it.
                </p>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                  <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Individual lots, posts and pages keep their own titles and descriptions; these defaults fill the gaps.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
