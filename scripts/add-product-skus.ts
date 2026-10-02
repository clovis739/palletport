import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  try {
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe(`ALTER TABLE "Lot" ADD COLUMN IF NOT EXISTS "sku" TEXT`);
      await tx.$executeRawUnsafe(`ALTER TABLE "Lot" ALTER COLUMN "sku" SET DEFAULT ('PP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)))`);
      await tx.$executeRawUnsafe(`UPDATE "Lot" SET "sku" = DEFAULT WHERE "sku" IS NULL OR "sku" = ''`);
      await tx.$executeRawUnsafe(`ALTER TABLE "Lot" ALTER COLUMN "sku" SET NOT NULL`);
      await tx.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Lot_sku_key" ON "Lot"("sku")`);
    });
    const [result] = await db.$queryRawUnsafe<{ total: bigint; unique: bigint; valid: bigint }[]>(`SELECT count(*) AS total, count(DISTINCT "sku") AS unique, count(*) FILTER (WHERE "sku" ~ '^PP-[0-9A-F]{12}$') AS valid FROM "Lot"`);
    if (result.total !== result.unique || result.total !== result.valid) throw new Error("SKU verification failed");
    console.log(`Verified ${result.total} unique PalletPort SKUs. Existing supplier identifiers were retained.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
