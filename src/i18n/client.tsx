"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, localizeHref, makeT, type Dictionary, type Locale, type TFunction } from "./config";

type Ctx = { locale: Locale; t: TFunction; lh: (href: string) => string };
const I18nContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, t: makeT(null), lh: (h) => h });

/** Set once in the root layout with the request's language and dictionary. */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary | null; children: ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, t: makeT(dict), lh: (h: string) => localizeHref(h, locale) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** { locale, t, lh } for client components. */
export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
