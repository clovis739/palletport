"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { NextIcon } from "@/components/Icons";
import type { AnnouncementSettings } from "@/lib/settings-schema";

/**
 * Site-wide announcement strip above the header (rendered by the root layout, hidden on /dashboard by
 * <HideOnAdmin>). Content comes from the `announcement` settings. Visitors can dismiss it for the rest of
 * their browser session; a new text brings it back. `preview` renders it for the admin editor (no storage).
 */

const TONES: Record<AnnouncementSettings["tone"], { bar: string; link: string; close: string }> = {
  info: { bar: "bg-ink text-white/85", link: "text-signal", close: "text-white/60 hover:bg-white/10 hover:text-white" },
  promo: { bar: "bg-signal text-white", link: "text-white underline underline-offset-2", close: "text-white/80 hover:bg-white/15 hover:text-white" },
  warning: { bar: "bg-amber-100 text-amber-950", link: "text-rust", close: "text-amber-900/70 hover:bg-amber-200 hover:text-amber-950" },
};

const STORAGE_KEY = "pp_announcement_dismissed";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export function AnnouncementBar({ settings: a, preview = false }: { settings: AnnouncementSettings; preview?: boolean }) {
  const id = hash(`${a.text}|${a.href ?? ""}`);
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (preview) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === id) setHidden(true);
    } catch {
      /* storage blocked — keep showing */
    }
  }, [id, preview]);

  if (!a.enabled || !a.text || hidden) return null;
  const t = TONES[a.tone] ?? TONES.info;

  function dismiss() {
    if (preview) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setHidden(true);
    setLeaving(true);
    window.setTimeout(() => setHidden(true), 260);
  }

  const linkClass = `tap hidden shrink-0 font-semibold sm:inline ${t.link}`;
  const label = a.linkLabel || "Learn more";
  return (
    <div
      role="region"
      aria-label="Announcement"
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
    >
      <div className="overflow-hidden">
        <div className={`text-center text-xs ${t.bar}`}>
          <div className="container-pp relative">
            <div className="flex items-center justify-center gap-4 px-7 py-2">
            <span className="min-w-0 truncate lg:hidden">{a.mobileText || a.text}</span>
            <span className="hidden lg:inline">{a.text}</span>
            {a.href &&
              (preview ? (
                <span className={linkClass}>{label}<NextIcon /></span>
              ) : /^https?:\/\//i.test(a.href) ? (
                <a href={a.href} className={linkClass} target="_blank" rel="noopener noreferrer">{label}<NextIcon /></a>
              ) : (
                <Link href={a.href} className={linkClass}>{label}<NextIcon /></Link>
              ))}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className={`absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full sm:right-3 ${t.close}`}
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
