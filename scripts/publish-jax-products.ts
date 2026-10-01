import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const snapshot = JSON.parse(readFileSync(join(process.cwd(), "prisma/jax-products.json"), "utf8")) as {
  total: number;
  products: { sku: string }[];
};
const skus = snapshot.products.map((product) => product.sku);
if (skus.length !== snapshot.total || new Set(skus).size !== snapshot.total) throw new Error("Catalog snapshot is incomplete");

async function main() {
  const prisma = new PrismaClient();
  try {
    const lots = await prisma.lot.findMany({
      where: { externalSku: { in: skus } },
      select: { externalSku: true, status: true, priceCents: true, available: true, images: true, description: true },
    });
    if (lots.length !== snapshot.total || lots.some((lot) => !lot.externalSku || lot.priceCents <= 0 || lot.available <= 0 || !lot.images || !lot.description)) {
      throw new Error(`Publication checks failed: ${lots.length}/${snapshot.total} products are ready`);
    }
    const unexpected = lots.filter((lot) => lot.status !== "DRAFT" && lot.status !== "ACTIVE");
    if (unexpected.length) throw new Error(`${unexpected.length} imported products have unexpected status`);
    const result = await prisma.lot.updateMany({
      where: { externalSku: { in: skus }, status: "DRAFT" },
      data: { status: "ACTIVE" },
    });
    console.log(`Published ${result.count} products. ${lots.length - result.count} were already active.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
