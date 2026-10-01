"use client";

import { useActionState, useState } from "react";
import { saveCategory } from "@/app/actions/catalog";
import { CATEGORY_GROUPS } from "@/lib/taxonomy";
import { Card } from "@/components/admin/Card";
import { SaveBar } from "@/components/admin/SaveBar";
import { TextField, TextArea, Toggle, Field } from "@/components/admin/FormField";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ActionMessage } from "@/components/admin/Flash";

export type CategoryDefaults = {
  id?: string;
  name?: string;
  slug?: string;
  group?: string;
  blurb?: string;
  hue?: number;
  image?: string;
  hidden?: boolean;
  /** Lots in the category: the slug is locked once there are any. */
  lotCount?: number;
};

const slugOf = (s: string) =>
  s.toLowerCase().replace(/&/g, " ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Create / edit a category. Used by /dashboard/categories/new and /dashboard/categories/[id]. */
export function CategoryForm({ d = {}, groups = [] }: { d?: CategoryDefaults; groups?: string[] }) {
  const [state, action] = useActionState(saveCategory, undefined);
  const [name, setName] = useState(d.name ?? "");
  const [slug, setSlug] = useState(d.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!d.slug);
  const [hue, setHue] = useState(d.hue ?? 24);
  const locked = (d.lotCount ?? 0) > 0;
  const groupOptions = [...new Set([...CATEGORY_GROUPS, ...groups.filter(Boolean)])];

  return (
    <form action={action} className="min-w-0 space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <ActionMessage state={state} />
      <Card title="Details" description="Shown in menus, on the categories page and at the top of the category page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="name"
            label="Name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched && !locked) setSlug(slugOf(e.target.value));
            }}
            placeholder="e.g. Video Games"
          />
          <TextField
            name="slug"
            label="URL slug"
            value={slug}
            readOnly={locked}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            hint={locked ? "Locked: this category has lots, so its web address stays the same." : `/c/${slug || "…"}`}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
          <Field label="Department group" htmlFor="f-group" hint="Menus list categories under these headings. Type a new one to add a group.">
            <input id="f-group" name="group" list="category-groups" defaultValue={d.group ?? ""} className="input" maxLength={40} placeholder="Choose or type…" />
            <datalist id="category-groups">{groupOptions.map((g) => <option key={g} value={g} />)}</datalist>
          </Field>
          <Field label="Accent colour" htmlFor="f-hue" hint="Background tint on the category page.">
            <div className="flex items-center gap-3">
              <input id="f-hue" name="hue" type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="min-w-0 flex-1 accent-signal" />
              <span aria-hidden className="h-9 w-9 shrink-0 rounded-lg" style={{ background: `hsl(${hue} 45% 90%)` }} />
            </div>
          </Field>
          <TextArea name="blurb" label="Short description" required maxLength={160} rows={2} defaultValue={d.blurb} wrapClassName="sm:col-span-2" hint="One line, e.g. “Consoles, games, controllers and gaming gear”." />
        </div>
      </Card>

      <Card title="Photo" description="Used on category cards and the category page. Leave empty to use the default stock photo.">
        <MediaPicker name="image" defaultValue={d.image ?? ""} />
      </Card>

      <Card title="Visibility">
        <Toggle name="hidden" defaultChecked={d.hidden} label="Hide from menus and category lists" description="The page and its lots still work by link and in search. Useful while you stock a new category." />
      </Card>

      <SaveBar saveLabel={d.id ? "Save category" : "Create category"} alwaysVisible={!d.id} resetKey={state?.savedAt} message={state?.error} />
    </form>
  );
}
