/**
 * Loads prisma/export.json (made by scripts/export-sqlite.py from the old SQLite dev.db) into the Postgres
 * database in DATABASE_URL (Neon). Run AFTER `npx prisma db push` has created the tables:
 *
 *     npx tsx scripts/import-data.ts            # add everything (rows that already exist are skipped)
 *     npx tsx scripts/import-data.ts --replace  # empty the Postgres tables first, then import
 *
 * Tables are loaded parent-first (worked out from the Prisma schema), SQLite values are converted
 * (0/1 → booleans, millisecond timestamps → dates) and unknown columns are ignored.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

type Row = Record<string, unknown>;
const prisma = new PrismaClient();
const replace = process.argv.includes("--replace");
const file = join(process.cwd(), "prisma", "export.json");

const models = Prisma.dmmf.datamodel.models;
const delegate = (name: string) => (prisma as unknown as Record<string, { createMany: (a: unknown) => Promise<{ count: number }>; deleteMany: () => Promise<unknown> }>)[name[0].toLowerCase() + name.slice(1)];

/** Parent tables before children (a model depends on the models its foreign keys point to). */
function loadOrder() {
  const deps = new Map(models.map((m) => [m.name, new Set(m.fields.filter((f) => f.kind === "object" && f.relationFromFields?.length && f.type !== m.name).map((f) => f.type))]));
  const done: string[] = [];
  while (done.length < models.length) {
    const next = models.find((m) => !done.includes(m.name) && [...deps.get(m.name)!].every((d) => done.includes(d)));
    if (!next) throw new Error("Circular relations: " + models.filter((m) => !done.includes(m.name)).map((m) => m.name).join(", "));
    done.push(next.name);
  }
  return done;
}

function convert(model: (typeof models)[number], row: Row): Row {
  const out: Row = {};
  for (const f of model.fields) {
    if (f.kind !== "scalar" && f.kind !== "enum") continue;
    if (!(f.name in row)) continue;
    const v = row[f.name];
    if (v === null || v === undefined) {
      out[f.name] = null;
      continue;
    }
    switch (f.type) {
      case "DateTime":
        out[f.name] = typeof v === "number" ? new Date(v) : new Date(String(/^\d+$/.test(String(v)) ? Number(v) : v));
        break;
      case "Boolean":
        out[f.name] = v === true || v === 1 || v === "1" || v === "true";
        break;
      case "Int":
        out[f.name] = Math.trunc(Number(v));
        break;
      case "Float":
        out[f.name] = Number(v);
        break;
      default:
        out[f.name] = v;
    }
  }
  return out;
}

async function main() {
  const data = JSON.parse(readFileSync(file, "utf8")) as Record<string, Row[]>;
  const order = loadOrder();
  if (replace) {
    for (const name of [...order].reverse()) await delegate(name).deleteMany();
    console.log("Emptied existing tables.");
  }
  for (const name of order) {
    const rows = data[name] ?? [];
    if (!rows.length) continue;
    const model = models.find((m) => m.name === name)!;
    let added = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map((r) => convert(model, r));
      added += (await delegate(name).createMany({ data: chunk, skipDuplicates: true })).count;
    }
    console.log(`${name}: ${added} of ${rows.length} added`);
  }
  const missing = Object.keys(data).filter((t) => !order.includes(t) && data[t].length);
  if (missing.length) console.log(`Skipped (not in the schema): ${missing.join(", ")}`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
