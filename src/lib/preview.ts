import "server-only";
import { getStaffUser } from "./auth";
import { can } from "./permissions";

/**
 * Draft previews on public content URLs: `/blog/my-post?preview=1`.
 * Returns true only when the query asks for a preview AND the visitor is signed-in staff with the `content`
 * permission (verified server-side). Everyone else gets the published version (or a 404 for drafts).
 * Pages that preview must also add `robots: noindex` to their metadata.
 */
export async function canPreview(searchParams: Promise<Record<string, string | string[] | undefined>> | undefined): Promise<boolean> {
  const sp = searchParams ? await searchParams : {};
  if (sp.preview !== "1") return false;
  const user = await getStaffUser();
  return !!user && can(user.role, "content");
}

export const PREVIEW_ROBOTS = { index: false, follow: false, googleBot: { index: false, follow: false } } as const;
