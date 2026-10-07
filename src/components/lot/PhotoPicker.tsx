"use client";
import { ProductPhoto } from "@/components/lot/ProductPhoto";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, Trash2, Undo2 } from "lucide-react";

// Sized so a full set of 10 photos fits in one save (Vercel rejects request bodies over 4.5 MB).
const MAX_EDGE = 1600;
const MAX_BYTES = 380_000;
const QUALITIES = [0.82, 0.72, 0.62];
/** Total new-photo bytes allowed in one save. */
export const MAX_BATCH_BYTES = 4_000_000;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
}

/**
 * Re-encodes phone photos in the browser before upload: longest edge capped at 1600px, WebP where the browser
 * can encode it (Safari silently returns PNG for unsupported types, so check blob.type), else JPEG, stepping the
 * quality down until the file is under ~380 KB. Keeps the original when it is already small enough.
 */
async function compress(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const longEdge = Math.max(bmp.width, bmp.height);
    if (file.size <= MAX_BYTES && longEdge <= MAX_EDGE) {
      bmp.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE / longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    let best: Blob | null = null;
    let ext = "webp";
    for (const q of QUALITIES) {
      let blob = await toBlob(canvas, "image/webp", q);
      ext = "webp";
      if (!blob || blob.type !== "image/webp") {
        blob = await toBlob(canvas, "image/jpeg", q);
        ext = "jpg";
      }
      if (blob) best = blob;
      if (blob && blob.size <= MAX_BYTES) break;
    }
    if (!best || best.size >= file.size) return file;
    return new File([best], `${file.name.replace(/\.\w+$/, "") || "photo"}.${ext}`, { type: best.type });
  } catch {
    return file;
  }
}

/**
 * Photo field for the lot form. Sends new files as `photos`; for existing photos sends
 * `keepImage` (one per kept photo) and `cover` (the chosen cover photo).
 */
export function PhotoPicker({ existing = [], max = 10 }: { existing?: string[]; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [cover, setCover] = useState(existing[0] ?? "");
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const kept = existing.filter((u) => !removed.includes(u));
  const room = max - kept.length;

  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(e.target.files ?? [])].slice(0, Math.max(0, room));
    setBusy(true);
    const files = await Promise.all(picked.map(compress));
    setTooBig(files.reduce((a, f) => a + f.size, 0) > MAX_BATCH_BYTES);
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    setPreviews(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
    setBusy(false);
  }

  return (
    <fieldset>
      <legend className="label">Photos</legend>
      <p className="mb-3 text-xs text-muted">
        Show the actual pallet: all four sides, the top, and a few close-ups of what's inside. Up to {max} photos. JPG, PNG or WebP.
        Until you add photos, the listing shows supplier photos matched to the lot type.
      </p>

      {existing.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {existing.map((u, idx) => {
            const gone = removed.includes(u);
            return (
              <li key={u} className={`relative overflow-hidden rounded-lg border ${cover === u && !gone ?"border-signal ring-2 ring-signal/30":"border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <ProductPhoto src={u} alt={`Current photo ${idx + 1}${gone ? " (marked for removal)" : ""}`} width={200} height={200} loading="lazy" decoding="async" className={`aspect-square w-full object-cover ${gone ? "opacity-30 grayscale" : ""}`} />
                {!gone && <input type="hidden" name="keepImage" value={u} />}
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                  {!gone && (
                    <label className="inline-flex min-h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold">
                      <input type="radio" name="cover" value={u} checked={cover === u} onChange={() => setCover(u)} className="sr-only" />
                      <Star aria-hidden className={`h-3 w-3 ${cover === u ? "fill-signal text-signal" : ""}`} /> {cover === u ? "Cover" : "Make cover"}
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => setRemoved((r) => (gone ? r.filter((x) => x !== u) : [...r, u]))}
                    className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded bg-white/90"
                    aria-label={gone ? "Keep photo" : "Remove photo"}
                  >
                    {gone ? <Undo2 aria-hidden className="h-3.5 w-3.5" /> : <Trash2 aria-hidden className="h-3.5 w-3.5 text-rust" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl p-6 text-center text-sm ${room <= 0 ?"pointer-events-none opacity-50":""}`}>
        <ImagePlus aria-hidden className="h-6 w-6 text-muted" />
        <span className="font-semibold">{busy ? "Preparing photos…" : room > 0 ? "Choose photos" : "Photo limit reached"}</span>
        <span className="text-xs text-muted">{room > 0 ? `${room} more allowed` : "Remove a photo to add another"}</span>
        <input ref={input} type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple onChange={onPick} className="sr-only" disabled={room <= 0} />
      </label>

      {tooBig && (
        <p role="alert" className="mt-3 rounded-lg bg-rust/10 p-3 text-xs font-medium text-rust">
          These photos are too large to upload in one save. Choose fewer, save the lot, then add the rest.
        </p>
      )}

      {previews.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-5">
          {previews.map((p) => (
            <li key={p.url} className="overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProductPhoto src={p.url} alt={`New photo: ${p.name}`} width={200} height={200} decoding="async" className="aspect-square w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
