"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { Field } from "@/components/admin/FormField";
import { Select } from "@/components/ui/Select";
import { Logo } from "@/components/Logo";
import { saveNavigation } from "@/app/actions/site";
import type { NavigationSettings, NavTone } from "@/lib/settings-schema";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { LinkEditor, SortableList, Text } from "../_components/fields";

type Value = NavigationSettings;
type F = FormCtx<Value>;

const PILL: Record<NavTone, string> = {
  primary: "shrink-0 rounded-full bg-ink px-3 py-1.5 font-semibold text-white",
  urgent: "shrink-0 rounded-full px-3 py-1.5 font-semibold text-rust",
  default: "shrink-0 rounded-full px-3 py-1.5 font-semibold",
};

const linkName = (it: unknown, i: number, what = "link") => (it as { label?: string }).label || `${what} ${i + 1}`;
const newLink = () => ({ label: "", href: "" });

function HeaderItem({ f, p, i }: { f: F; p: string; i: number }) {
  const item = f.value.header[i];
  const kids = item.children ?? [];
  const [open, setOpen] = useState(kids.length > 0 || f.hasErr(`${p}.children`));
  return (
    <div className="space-y-3">
      <LinkEditor f={f} path={p} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Style" htmlFor={`tone-${i}`} className="w-44">
          <Select id={`tone-${i}`} value={item.tone ?? "default"} onChange={(e) => f.update((d) => void (d.header[i].tone = e.target.value as NavTone))}>
            <option value="default">Plain</option>
            <option value="primary">Highlighted (dark)</option>
            <option value="urgent">Urgent (red text)</option>
          </Select>
        </Field>
        <button type="button" className="btn-ghost py-2" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          Dropdown links{kids.length ? ` (${kids.length})` : ""}
        </button>
      </div>
      {open && (
        <div className="rounded-xl bg-sand/50 p-3">
          <p className="mb-2 text-xs text-muted">With dropdown links, this item opens a menu (its own link becomes the first entry, “All …”). Leave empty for a plain link.</p>
          <SortableList
            f={f}
            path={`${p}.children`}
            dense
            max={12}
            addLabel="Add dropdown link"
            newItem={newLink}
            itemName={(it, j) => linkName(it, j, "dropdown link")}
            render={(cp) => <LinkEditor f={f} path={cp} compact />}
          />
        </div>
      )}
    </div>
  );
}

function Preview({ v, categories }: { v: Value; categories: string[] }) {
  return (
    <>
      <div>
        <p className="label">Header preview</p>
        <div className="overflow-hidden rounded-2xl bg-paper" aria-label="Header preview">
          <div className="flex h-12 items-center px-3 text-ink">
            <Logo className="origin-left scale-75" />
          </div>
          <div className="flex gap-1 overflow-x-auto px-2 py-2 text-xs [scrollbar-width:thin]">
            {v.header.map((h, i) => (
              <span key={i} className={`${PILL[h.tone ?? "default"]} inline-flex items-center gap-0.5`}>
                {h.label || "…"}
                {!!h.children?.length && <ChevronDown aria-hidden className="h-3 w-3" />}
              </span>
            ))}
            {v.header.length > 0 && categories.length > 0 && <span className="mx-1 w-px shrink-0 bg-line" />}
            {categories.map((c) => (
              <span key={c} className="shrink-0 rounded-full px-3 py-1.5 text-ink/60">{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div>
        <p className="label">Footer preview</p>
        <div className="rounded-2xl bg-ink p-4 text-[11px] text-white/75" aria-label="Footer preview">
          {v.footerBlurb && <p className="mb-3 text-white/55">{v.footerBlurb}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {v.footerColumns.map((c, i) => (
              <div key={i} className="min-w-0">
                <p className="mb-1 font-semibold uppercase tracking-wider text-white">{c.title || "…"}</p>
                <ul className="space-y-0.5">
                  {c.links.map((l, j) => <li key={j} className="truncate">{l.label || "…"}</li>)}
                </ul>
              </div>
            ))}
          </div>
          {v.legalLinks.length > 0 && (
            <p className="mt-3 pt-2 text-white/45">{v.legalLinks.map((l) => l.label || "…").join(" · ")}</p>
          )}
        </div>
      </div>
    </>
  );
}

export function NavigationForm({ initial, categories }: { initial: Value; categories: string[] }) {
  return (
    <SettingsForm initial={initial} action={saveNavigation} aside={(v) => <Preview v={v} categories={categories} />}>
      {(f) => (
        <>
          <Card title="Header quick links" description="The row of links under the search bar (desktop and tablet), and the top of the mobile menu. Your catalog categories are added after these automatically.">
            <SortableList
              f={f}
              path="header"
              max={16}
              addLabel="Add header link"
              newItem={() => ({ label: "", href: "", tone: "default", children: [] })}
              itemName={(it, i) => linkName(it, i, "header link")}
              render={(p, i) => <HeaderItem f={f} p={p} i={i} />}
              empty={<p className="text-sm text-muted">No header links — only categories will show.</p>}
            />
          </Card>

          <Card title="Mobile menu extras" description="Extra links in the phone menu's “Shop” list, after the header links.">
            <SortableList f={f} path="mobileExtra" dense max={12} addLabel="Add mobile link" newItem={newLink} itemName={(it, i) => linkName(it, i, "mobile link")} render={(p) => <LinkEditor f={f} path={p} compact />} />
          </Card>

          <Card title="Footer" description="Short blurb under the logo and up to five link columns.">
            <div className="space-y-5">
              <Text f={f} path="footerBlurb" label="Footer blurb" rows={3} max={400} />
              <SortableList
                f={f}
                path="footerColumns"
                max={5}
                addLabel="Add column"
                newItem={() => ({ title: "", links: [] })}
                itemName={(it, i) => (it as { title?: string }).title || `column ${i + 1}`}
                render={(p) => (
                  <div className="space-y-3">
                    <Text f={f} path={`${p}.title`} label="Column title" className="max-w-xs" />
                    <div className="rounded-xl bg-sand/50 p-3">
                      <SortableList f={f} path={`${p}.links`} dense max={20} addLabel="Add link" newItem={newLink} itemName={(it, j) => linkName(it, j)} render={(lp) => <LinkEditor f={f} path={lp} compact />} />
                    </div>
                  </div>
                )}
              />
            </div>
          </Card>

          <Card title="Legal links" description="The small links at the very bottom of every page.">
            <SortableList f={f} path="legalLinks" dense max={16} addLabel="Add legal link" newItem={newLink} itemName={(it, i) => linkName(it, i, "legal link")} render={(p) => <LinkEditor f={f} path={p} compact />} />
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
