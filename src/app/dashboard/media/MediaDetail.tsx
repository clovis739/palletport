"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, FileText, Loader2, Settings2, Trash2 } from "lucide-react";
import { deleteMediaAction, mediaUsage, updateAltAction } from "@/app/actions/media";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Dialog } from "@/components/admin/media/Dialog";
import { ALT_MAX, formatBytes, formatDate, formatDims, type MediaItem, type MediaUsage } from "@/components/admin/media/types";

type ToastFn = (t: { text: string; tone: "success" | "error" | "info" }) => void;

/** Side drawer with a large preview, details, alt text editor, "Used in" and delete. */
export function MediaDetail({
  item,
  onClose,
  onUpdated,
  onDeleted,
  onCopy,
  onToast,
}: {
  item: MediaItem | null;
  onClose: () => void;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
  onCopy: (item: MediaItem) => void;
  onToast: ToastFn;
}) {
  return (
    <Dialog open={!!item} onClose={onClose} variant="drawer" title={item?.filename ?? "Image"} description={item ? [formatDims(item.width, item.height), formatBytes(item.size)].filter(Boolean).join(" · ") : undefined}>
      {item && <DetailBody key={item.id} item={item} onUpdated={onUpdated} onDeleted={onDeleted} onCopy={onCopy} onToast={onToast} />}
    </Dialog>
  );
}

function DetailBody({ item, onUpdated, onDeleted, onCopy, onToast }: { item: MediaItem; onUpdated: (i: MediaItem) => void; onDeleted: (id: string) => void; onCopy: (i: MediaItem) => void; onToast: ToastFn }) {
  const altId = useId();
  const [alt, setAlt] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const [altError, setAltError] = useState<string | null>(null);
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);

  useEffect(() => {
    let live = true;
    mediaUsage(item.url)
      .then((u) => live && setUsage(u))
      .catch(() => live && setUsage([]));
    return () => {
      live = false;
    };
  }, [item.url]);

  const dirty = alt.trim() !== item.alt;

  async function saveAlt(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setAltError(null);
    try {
      const r = await updateAltAction({ id: item.id, alt });
      if (r.error) setAltError(r.error);
      else if (r.item) {
        onUpdated(r.item);
        setAlt(r.item.alt);
        onToast({ text: r.ok ?? "Saved", tone: "success" });
      }
    } catch {
      setAltError("Couldn't save. You may not have permission to edit media.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      const r = await deleteMediaAction({ id: item.id, force: (usage?.length ?? item.uses) > 0 });
      if (r.deleted.includes(item.id)) {
        onDeleted(item.id);
        onToast({ text: "Image deleted", tone: "success" });
      } else {
        if (r.inUse) setUsage(null);
        onToast({ text: r.error ?? "Couldn't delete the image.", tone: "error" });
        if (r.inUse) mediaUsage(item.url).then(setUsage).catch(() => setUsage([]));
      }
    } catch {
      onToast({ text: "Couldn't delete. You may not have permission.", tone: "error" });
    }
  }

  const used = usage?.length ?? 0;

  return (
    <div className="space-y-6 p-4 sm:p-5">
      <div className="overflow-hidden rounded-xl bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.alt} width={item.width ?? 800} height={item.height ?? 600} decoding="async" className="mx-auto max-h-[45vh] w-auto max-w-full object-contain" />
      </div>

      <form onSubmit={saveAlt} className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={altId} className="label mb-0">Alt text</label>
          <span className={`text-[11px] ${alt.length > ALT_MAX ? "text-rust" : "text-muted"}`}>{alt.length}/{ALT_MAX}</span>
        </div>
        <textarea
          id={altId}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          rows={3}
          maxLength={ALT_MAX + 50}
          aria-describedby={`${altId}-hint`}
          aria-invalid={!!altError || undefined}
          placeholder="e.g. Forklift lifting a pallet of boxed air fryers"
          className="input resize-y"
        />
        <p id={`${altId}-hint`} className="text-xs text-muted">
          Describe what's in the picture for screen-reader users and search engines. Used as the default when this image is placed on a page.
        </p>
        {altError && <p className="text-xs font-medium text-rust" role="alert">{altError}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-dark py-2" disabled={!dirty || saving || alt.length > ALT_MAX}>
            {saving && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />} Save alt text
          </button>
          {dirty && (
            <button type="button" className="btn-ghost py-2" onClick={() => setAlt(item.alt)}>
              Reset
            </button>
          )}
        </div>
      </form>

      <div>
        <p className="label">File URL</p>
        <div className="flex gap-2">
          <input readOnly value={item.url} aria-label="File URL" className="input min-w-0 flex-1 py-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn-ghost shrink-0 px-3 py-2" onClick={() => onCopy(item)}>
            <Copy aria-hidden className="h-4 w-4" /> Copy
          </button>
          <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 px-3 py-2" aria-label="Open original in a new tab">
            <ExternalLink aria-hidden className="h-4 w-4" />
          </a>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-sand/50 p-4 text-sm">
        <Info label="Type" value={item.ext.toUpperCase()} />
        <Info label="Dimensions" value={formatDims(item.width, item.height) || "Unknown"} />
        <Info label="File size" value={formatBytes(item.size)} />
        <Info label="Uploaded" value={formatDate(item.createdAt)} />
        <Info label="Uploaded by" value={item.uploadedBy ?? "Unknown"} wide />
      </dl>

      <section aria-labelledby={`${altId}-used`}>
        <h3 id={`${altId}-used`} className="label">Used in</h3>
        {usage === null ? (
          <p className="flex items-center gap-2 text-sm text-muted"><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Checking pages and settings…</p>
        ) : usage.length === 0 ? (
          <p className="text-sm text-muted">Not used on any page, post or site setting.</p>
        ) : (
          <ul className="rounded-xl">
            {usage.map((u) => {
              const Icon = u.kind === "content" ? FileText : Settings2;
              return (
                <li key={`${u.kind}-${u.id}`}>
                  <Link href={u.href} className="flex items-center gap-3 px-3 py-2.5 hover:bg-sand/60 focus-visible:outline-2 focus-visible:outline-signal">
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{u.label}</span>
                      <span className="block text-xs text-muted">{u.sub}</span>
                    </span>
                    <span className="text-xs font-semibold text-signal">Edit</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted">Checks pages, posts, guides, help and legal content, plus site settings. Lots use their own photos.</p>
      </section>

      <section className="rounded-xl border border-rust/25 p-4">
        <h3 className="font-semibold text-rust">Delete image</h3>
        <p className="mt-1 text-xs text-muted">
          {used > 0
            ? `This image is used in ${used} place${used === 1 ? "" : "s"}. Those pages will show a missing image until you pick another one.`
            : "The file is removed from the server. This can't be undone."}
        </p>
        <form action={remove} className="mt-3">
          <ConfirmButton
            className="btn-ghost py-2 text-rust"
            confirmLabel={used > 0 ? "Delete anyway" : "Delete image"}
            prompt={used > 0 ? `Used in ${used} place${used === 1 ? "" : "s"}. Delete?` : "Delete permanently?"}
          >
            <Trash2 aria-hidden className="h-4 w-4" /> Delete
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}
