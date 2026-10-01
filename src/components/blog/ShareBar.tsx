"use client";

import { useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = (base: string) => {
    const url = encodeURIComponent(window.location.href);
    const t = encodeURIComponent(title);
    window.open(base.replace("{url}", url).replace("{title}", t), "_blank", "noopener,noreferrer,width=600,height=500");
  };
  return (
    <div>
      <p className="label">Share this article</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => share("https://www.linkedin.com/sharing/share-offsite/?url={url}")} className="btn-ghost px-3 py-2 text-xs"><Share2 aria-hidden className="h-3.5 w-3.5" /> LinkedIn</button>
        <button type="button" onClick={() => share("https://www.facebook.com/sharer/sharer.php?u={url}")} className="btn-ghost px-3 py-2 text-xs"><Share2 aria-hidden className="h-3.5 w-3.5" /> Facebook</button>
        <button type="button" onClick={() => share("https://x.com/intent/post?url={url}&text={title}")} className="btn-ghost px-3 py-2 text-xs"><Share2 aria-hidden className="h-3.5 w-3.5" /> X</button>
        <button type="button" onClick={() => share("mailto:?subject={title}&body={url}")} className="btn-ghost px-3 py-2 text-xs"><Mail aria-hidden className="h-3.5 w-3.5" /> Email</button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* blocked */
            }
          }}
          className="btn-ghost px-3 py-2 text-xs"
        >
          {copied ? <><Check aria-hidden className="h-3.5 w-3.5" /> Copied!</> : <><Link2 aria-hidden className="h-3.5 w-3.5" /> Copy link</>}
        </button>
      </div>
    </div>
  );
}
