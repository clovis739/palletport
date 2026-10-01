"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PROMO_COOKIE } from "@/lib/cart";

export async function applyPromo(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const store = await cookies();
  if (code) store.set(PROMO_COOKIE, code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  else store.delete(PROMO_COOKIE);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function removePromo() {
  (await cookies()).delete(PROMO_COOKIE);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
