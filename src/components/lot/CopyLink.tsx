"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useI18n } from "@/i18n/client";

export function CopyLink() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard blocked — ignore */
        }
      }}
    >
      {done ? <><Check aria-hidden className="h-4 w-4" /> {t("Link copied")}</> : <><Share2 aria-hidden className="h-4 w-4" /> {t("Share")}</>}
    </button>
  );
}
