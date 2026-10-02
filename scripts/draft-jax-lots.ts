/**
 * Hides (DRAFT) every live listing that still uses Jax Wholesale photo links, so they leave the site,
 * the sitemap and the Google product feed until you add your own photos.
 *
 *   npm run catalog:jax-drafts            -> preview only, changes nothing
 *   npm run catalog:jax-drafts -- --apply -> switch them to DRAFT (ids saved for undo)
 *   npm run catalog:jax-drafts -- --undo  -> put those same listings back to ACTIVE
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { db } from "../src/lib/db";

const JAX = "jaxwholesaleliquidation.com";
const SAVE = "node_modules/.cache/jax-drafted-ids.json";
const mode = process.argv.includes("--undo") ? "undo" : process.argv.includes("--apply") ? "apply" : "preview";

async function main() {
  if (mode === "undo") {
    if (!existsSync(SAVE)) throw new Error(`Nothing to undo (${SAVE} not found).`);
    const ids: string[] = JSON.parse(readFileSync(SAVE, "utf8"));
    const r = await db.lot.updateMany({ where: { id: { in: ids }, status: "DRAFT" }, data: { status: "ACTIVE" } });
    console.log(`Restored ${r.count} listing(s) to ACTIVE.`);
    return;
  }
  const lots = await db.lot.findMany({
    where: { status: "ACTIVE", OR: [{ images: { contains: JAX } }, { externalUrl: { contains: JAX } }] },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`${lots.length} live listing(s) use Jax photos or links.`);
  lots.slice(0, 5).forEach((l) => console.log(`  - ${l.title}`));
  if (lots.length > 5) console.log(`  ...and ${lots.length - 5} more`);
  if (mode === "preview") {
    console.log("\nPreview only. Run again with --apply to switch them to DRAFT.");
    return;
  }
  mkdirSync("node_modules/.cache", { recursive: true });
  const previous: string[] = existsSync(SAVE) ? JSON.parse(readFileSync(SAVE, "utf8")) : [];
  writeFileSync(SAVE, JSON.stringify([...new Set([...previous, ...lots.map((l) => l.id)])]));
  const r = await db.lot.updateMany({ where: { id: { in: lots.map((l) => l.id) } }, data: { status: "DRAFT" } });
  console.log(`\nSwitched ${r.count} listing(s) to DRAFT. Undo any time with --undo.`);
}

main()
  .catch((e) => { console.error("Failed:", e?.message ?? e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
