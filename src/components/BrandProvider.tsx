"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Brand name + orange part of the logo, from Admin → Site settings → Business profile (set in the root layout). */
type Brand = { name: string; accent: string };
const BrandContext = createContext<Brand>({ name: "PalletPort", accent: "Port" });

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);
