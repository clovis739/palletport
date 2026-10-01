"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { uploadMediaAction } from "@/app/actions/media";
import { ACCEPT, prepareImage, rejectReason, tooLarge } from "./client-utils";
import { MEDIA_MAX_MB, formatBytes, type MediaItem } from "./types";

type Status = "queued" | "preparing" | "uploading" | "done" | "error";
type Job = { key: string; name: string; size: number; status: Status; error?: string; preview?: string; item?: MediaItem };

const LABEL: Record<Status, string> = { queued: "Waiting…", preparing: "Optimizing…", uploading: "Uploading…", done: "Uploaded", error: "Failed" };
const CONCURRENCY = 2;

/**
 * Drag-and-drop + file-button uploader with a per-file status list. Each file is optimized in the browser
 * (see prepareImage) and uploaded with its own Server Action call, so one bad file doesn't stop the rest.
 * Calls `onUploaded(items)` after each successful file.
 */
export function UploadZone({
  onUploaded,
  compact = false,
  disabled = false,
  disabledReason,
}: {
  onUploaded: (items: MediaItem[]) => void;
  compact?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const queue = useRef<{ job: Job; file: File }[]>([]);
  const running = useRef(0);
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  const patch = useCallback((key: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...p } : j))), []);

  // Revoke preview object URLs on unmount.
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  useEffect(() => () => jobsRef.current.forEach((j) => j.preview && URL.revokeObjectURL(j.preview)), []);

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && queue.current.length) {
      const { job, file } = queue.current.shift()!;
      running.current++;
      (async () => {
        try {
          patch(job.key, { status: "preparing" });
          const ready = await prepareImage(file);
          const big = tooLarge(ready);
          if (big) throw new Error(big);
          patch(job.key, { status: "uploading", size: ready.size });
          const fd = new FormData();
          fd.append("files", ready);
          const res = await uploadMediaAction(fd);
          if (res.error || !res.items.length) throw new Error(res.error ?? "Upload failed. Try again.");
          patch(job.key, { status: "done", item: res.items[0] });
          onUploadedRef.current(res.items);
        } catch (e) {
          const msg = e instanceof Error && e.message && !/^NEXT_|digest/i.test(e.message) ? e.message : "Upload failed. Check your connection and permissions.";
          patch(job.key, { status: "error", error: msg.includes("Server Components render") ? "You don't have permission to upload images." : msg });
        } finally {
          running.current--;
          pump();
        }
      })();
    }
  }, [patch]);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      if (disabled) return;
      const files = [...list];
      if (!files.length) return;
      const next: Job[] = files.map((f, i) => {
        const key = `${Date.now()}-${i}-${f.name}`;
        const reason = rejectReason(f) ?? (/gif$/i.test(f.type) ? tooLarge(f) : null);
        return reason
          ? { key, name: f.name, size: f.size, status: "error", error: reason }
          : { key, name: f.name, size: f.size, status: "queued", preview: URL.createObjectURL(f) };
      });
      setJobs((js) => [...next, ...js].slice(0, 60));
      next.forEach((j, i) => j.status === "queued" && queue.current.push({ job: j, file: files[i] }));
      pump();
    },
    [disabled, pump],
  );

  const active = jobs.filter((j) => j.status === "queued" || j.status === "preparing" || j.status === "uploading").length;
  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "error").length;

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => {
          if (disabled || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          depth.current++;
          setOver(true);
        }}
        onDragOver={(e) => {
          if (disabled || !e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (!depth.current) setOver(false);
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          depth.current = 0;
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl text-center transition-colors ${
 compact ?"px-4 py-8":"px-4 py-8 sm:py-10"
 } ${disabled ?"bg-sand/40 opacity-70": over ?"bg-signal/10":"bg-sand"}`}
      >
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${over ? "bg-signal text-white" : "bg-sand text-ink/70"}`}>
          <UploadCloud aria-hidden className="h-6 w-6" />
        </span>
        <p className="font-semibold">{disabled ? (disabledReason ?? "Uploading is not available") : over ? "Drop to upload" : "Drag images here"}</p>
        {!disabled && (
          <>
            <p className="text-xs text-muted">
              JPG, PNG, WebP or GIF · up to {MEDIA_MAX_MB} MB each · large photos are resized to 2400px automatically
            </p>
            <label htmlFor={inputId} className="btn-dark mt-1 cursor-pointer py-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal">
              <ImagePlus aria-hidden className="h-4 w-4" /> Choose files
            </label>
            <input
              ref={input}
              id={inputId}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="rounded-xl bg-white">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
            <p className="font-semibold" aria-live="polite">
              {active ? `Uploading ${active} file${active === 1 ? "" : "s"}…` : `${done} uploaded${failed ? ` · ${failed} failed` : ""}`}
            </p>
            {!active && (
              <button
                type="button"
                className="ml-auto rounded-full px-2 py-1 font-semibold text-muted hover:bg-sand hover:text-ink"
                onClick={() => {
                  jobs.forEach((j) => j.preview && URL.revokeObjectURL(j.preview));
                  setJobs([]);
                }}
              >
                Clear list
              </button>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto" data-lenis-prevent>
            {jobs.map((j) => (
              <li key={j.key} className="flex items-center gap-3 px-3 py-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-sand">
                  {j.item || j.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={j.item?.url ?? j.preview} alt="" width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    <AlertCircle aria-hidden className="h-4 w-4 text-rust" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={j.name}>{j.name}</p>
                  {j.status === "error" ? (
                    <p className="text-xs text-rust" role="alert">{j.error}</p>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand" role="progressbar" aria-label={`${j.name}: ${LABEL[j.status]}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={j.status === "done" ? 100 : j.status === "uploading" ? 66 : j.status === "preparing" ? 33 : 0}>
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ${j.status === "done" ? "bg-moss" : "bg-signal"} ${j.status === "uploading" ? "motion-safe:animate-pulse" : ""}`}
                          style={{ width: j.status === "done" ? "100%" : j.status === "uploading" ? "66%" : j.status === "preparing" ? "33%" : "6%" }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-[11px] text-muted">{j.status === "done" ? formatBytes(j.size) : LABEL[j.status]}</span>
                    </div>
                  )}
                </div>
                {j.status === "error" ? (
                  <button
                    type="button"
                    aria-label={`Dismiss ${j.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
                    onClick={() => setJobs((js) => js.filter((x) => x.key !== j.key))}
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center" aria-hidden>
                    {j.status === "done" ? <CheckCircle2 className="h-4 w-4 text-moss" /> : <Loader2 className="h-4 w-4 animate-spin text-muted" />}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
