"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { FormSection } from "@/components/admin/FormField";
import { saveFaqs } from "@/app/actions/site";
import { FAQ_PAGES, type FaqPage, type FaqsSettings } from "@/lib/settings-schema";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { SortableList, Switch, Text } from "../_components/fields";

type F = FormCtx<FaqsSettings>;

const PAGES: Record<FaqPage, { title: string; where: string; href: string }> = {
  home: { title: "Homepage", where: "Below the last homepage section.", href: "/#faq" },
  about: { title: "About page", where: "Above the thank-you cards on /about.", href: "/about#faq" },
  blog: { title: "Blog", where: "Below the article list on /blog (first page only, not on search or tag views).", href: "/blog#faq" },
};

function FaqBlockCard({ f, page }: { f: F; page: FaqPage }) {
  const meta = PAGES[page];
  const block = f.value[page];
  return (
    <Card
      title={meta.title}
      description={meta.where}
      actions={
        <Link href={meta.href} target="_blank" rel="noopener" className="btn-ghost py-1.5 text-sm">
          <ExternalLink aria-hidden className="h-4 w-4" /> View
        </Link>
      }
    >
      <div className="space-y-4">
        <Switch f={f} path={`${page}.enabled`} label="Show the FAQ section" />
        {block.enabled && (
          <>
            <FormSection title="Heading">
              <div className="grid gap-3 sm:grid-cols-2">
                <Text f={f} path={`${page}.title`} label="Title" max={80} placeholder="Frequently asked questions" />
                <Text f={f} path={`${page}.intro`} label="Intro" hint="Optional" max={200} />
              </div>
            </FormSection>
            <FormSection title="Questions" description="The first question starts open. Drag or use the arrows to reorder.">
              <SortableList
                f={f}
                path={`${page}.items`}
                dense
                max={20}
                addLabel="Add question"
                newItem={() => ({ q: "", a: "" })}
                itemName={(it, i) => (it as { q?: string }).q || `question ${i + 1}`}
                empty={<p className="text-sm text-muted">No questions yet. The section is hidden until you add one.</p>}
                render={(p) => (
                  <div className="space-y-2">
                    <Text f={f} path={`${p}.q`} label="Question" max={140} required />
                    <Text f={f} path={`${p}.a`} label="Answer" rows={3} max={600} required />
                  </div>
                )}
              />
            </FormSection>
          </>
        )}
      </div>
    </Card>
  );
}

export function FaqsForm({ initial, storeName, storeLocation }: { initial: FaqsSettings; storeName: string; storeLocation: string }) {
  return (
    <SettingsForm initial={initial} action={saveFaqs}>
      {(f) => (
        <>
          <p className="rounded-xl bg-white p-3 text-sm text-ink/75">
            Use <code className="font-mono">{"{name}"}</code> for your business name ({storeName}) and{" "}
            <code className="font-mono">{"{location}"}</code> for your warehouse location ({storeLocation}). Keep answers factual: they
            appear in Google as written.
          </p>
          {FAQ_PAGES.map((p) => (
            <FaqBlockCard key={p} f={f} page={p} />
          ))}
        </>
      )}
    </SettingsForm>
  );
}
