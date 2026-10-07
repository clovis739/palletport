"use client";

import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_LABEL, LOCALE_SHORT, stripLocale, type Locale } from "@/i18n/config";

/** Where the same page lives in the other language. English links carry ?lang=en so the middleware forgets Spanish. */
function hrefFor(target: Locale, path: string, search: string) {
  const base = stripLocale(path || "/");
  if (target === "es") return `${base === "/" ? "/es" : `/es${base}`}${search}`;
  const qs = new URLSearchParams(search);
  qs.set("lang", "en");
  return `${base}?${qs.toString()}`;
}

/**
 * EN | ES switch. A plain link (full page load) so the server renders the other language straight away.
 * `variant="dark"` for the footer, `"menu"` for the mobile drawer.
 */
export function LanguageSwitcher({ variant = "light", className = "" }: { variant?: "light" | "dark" | "menu"; className?: string }) {
  const { locale, t } = useI18n();
  const path = usePathname() ?? "/";
  const go = (target: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Keep the current query string (filters, page) when switching.
    e.currentTarget.href = hrefFor(target, window.location.pathname, window.location.search);
  };
  const dark = variant === "dark";
  const base =
    variant === "menu"
      ? "flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition-colors"
      : "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors";
  // Frosted-glass track with a brighter glass pill for the active language.
  const glass = dark
    ? "border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md"
    : "border border-white/70 bg-gradient-to-b from-white/70 to-slate-200/50 shadow-[0_4px_16px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-ink/10 backdrop-blur-md";
  const on = dark
    ? "bg-white/25 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-sm"
    : "bg-white/80 text-ink shadow-[0_1px_6px_rgba(15,23,42,0.12)] ring-1 ring-white/80";
  const off = dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-white/50 hover:text-ink";
  return (
    <nav
      aria-label={t("Language")}
      className={`inline-flex items-center gap-0.5 rounded-full p-1 ${glass} ${variant === "menu" ? "w-full" : ""} ${className}`}
    >
      {variant !== "menu" && <Globe aria-hidden className={`ml-1 mr-0.5 h-4 w-4 ${dark ? "text-white/60" : "text-muted"}`} />}
      {LOCALES.map((l) => (
        <a
          key={l}
          href={hrefFor(l, path, "")}
          onClick={go(l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          aria-label={LOCALE_LABEL[l]}
          className={`${base} ${l === locale ? on : off}`}
        >
          {variant === "menu" ? LOCALE_LABEL[l] : LOCALE_SHORT[l]}
        </a>
      ))}
    </nav>
  );
}
