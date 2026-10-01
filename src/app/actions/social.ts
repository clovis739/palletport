"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function toggleFavorite(formData: FormData) {
  const lotId = String(formData.get("lotId"));
  const back = String(formData.get("back") ?? "/");
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(back)}`);
  const key = { userId_lotId: { userId: session.userId, lotId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: session.userId, lotId } });
  revalidatePath(back);
  revalidatePath("/account/favorites");
}
