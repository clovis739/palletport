import { toggleFavorite } from "@/app/actions/social";
import { Heart } from "lucide-react";
import { getT } from "@/i18n/server";

export async function FavoriteButton({ lotId, saved, back }: { lotId: string; saved: boolean; back: string }) {
  const t = await getT();
  return (
    <form action={toggleFavorite}>
      <input type="hidden" name="lotId" value={lotId} />
      <input type="hidden" name="back" value={back} />
      <button className={saved ? "btn-primary" : "btn-ghost"} aria-pressed={saved}>
        <Heart aria-hidden className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        {t(saved ? "Watching" : "Watch")}
      </button>
    </form>
  );
}
