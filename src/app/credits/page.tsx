import Link from "next/link";
import { LOT_TOPICS, PHOTOS } from "@/content/photos";
import { Photo } from "@/components/Photo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Photo credits",
  description:
    "Credits for the stock photography used on PalletPort's marketing pages. Lot pages show real photos of the pallet when available.",
  path: "/credits",
});

export default function Credits() {
  const photos = [...Object.values(PHOTOS), ...LOT_TOPICS.flatMap((t) => t.photos)];
  return (
    <div className="container-pp py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">Photo credits</h1>
      <p className="mt-2 max-w-2xl text-muted">
        The general photography on our homepage, category, About, How it works and blog pages comes from{" "}
        <a href="https://unsplash.com" className="font-semibold text-signal-dark hover:underline" target="_blank" rel="noreferrer">Unsplash</a>{" "}
        under the <a href="https://unsplash.com/license" className="font-semibold text-signal-dark hover:underline" target="_blank" rel="noreferrer">Unsplash License</a>.
        Thank you to the photographers below. Lots without their own photos show a stock photo; photos we upload of a lot show that actual lot.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="card overflow-hidden">
            <Photo photo={p} width={320} ratio={4 / 3} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="aspect-[4/3] w-full" />
            <div className="p-3 text-sm">
              <p className="line-clamp-1 font-semibold">{p.alt}</p>
              <a href={`${p.page}?utm_source=palletport&utm_medium=referral`} target="_blank" rel="noreferrer" className="text-muted hover:text-signal-dark hover:underline">
                Photo by {p.by} on Unsplash
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-muted">Spotted your photo and have a question? <Link href="/contact" className="font-semibold text-signal-dark hover:underline">Contact us</Link>.</p>
    </div>
  );
}
