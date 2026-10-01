"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Paths that render their own chrome (the admin), so the storefront header/footer are hidden there. */
export const ADMIN_PREFIX = "/dashboard";

/**
 * Hides storefront chrome (Header, Footer) on admin routes. Client-side so it stays correct across
 * client navigations (the root layout itself doesn't re-render when moving between / and /dashboard).
 */
export function HideOnAdmin({ children, active }: { children: ReactNode; /** Only true for signed-in staff, so non-staff see a normal 404 page on admin URLs. */ active: boolean }) {
  const path = usePathname() ?? "";
  if (active && (path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`))) return null;
  return <>{children}</>;
}
