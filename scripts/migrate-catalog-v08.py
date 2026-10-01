"""
One-off dev.db migration for v0.8 (catalogue restructure). Safe to re-run.
  - adds Category.group/position/image/hidden, Subcategory.position, Lot.brand (+ indexes)
  - applies the standard structure (taxonomy.json exported from src/lib/taxonomy.ts)
  - moves lots out of retired subcategories (Footwear → Shoes, Phone Accessories → Phones & Computers, …)
  - inserts the sample listings from prisma/sample-lots.json (skips slugs that already exist)
Usage: python3 migrate-catalog-v08.py <dev.db> <taxonomy.json> <sample-lots.json>
"""
import json, random, sqlite3, string, sys, time

db_path, tax_path, lots_path = sys.argv[1:4]
tax = json.load(open(tax_path))
samples = json.load(open(lots_path, encoding="utf-8"))
c = sqlite3.connect(db_path)
c.execute("PRAGMA foreign_keys = ON")


def cuid():
    return "c" + "".join(random.choices(string.ascii_lowercase + string.digits, k=24))


def cols(t):
    return {r[1] for r in c.execute(f'PRAGMA table_info("{t}")')}


def add(t, col, ddl):
    if col not in cols(t):
        c.execute(f'ALTER TABLE "{t}" ADD COLUMN {ddl}')


add("Category", "group", '"group" TEXT NOT NULL DEFAULT \'\'')
add("Category", "position", '"position" INTEGER NOT NULL DEFAULT 0')
add("Category", "image", '"image" TEXT NOT NULL DEFAULT \'\'')
add("Category", "hidden", '"hidden" BOOLEAN NOT NULL DEFAULT false')
add("Subcategory", "position", '"position" INTEGER NOT NULL DEFAULT 0')
add("Lot", "brand", '"brand" TEXT NOT NULL DEFAULT \'\'')
for sql in [
    'CREATE INDEX IF NOT EXISTS "Category_group_position_idx" ON "Category"("group", "position")',
    'CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_position_idx" ON "Subcategory"("categoryId", "position")',
    'CREATE INDEX IF NOT EXISTS "Lot_subcategoryId_idx" ON "Lot"("subcategoryId")',
    'CREATE INDEX IF NOT EXISTS "Lot_brand_idx" ON "Lot"("brand")',
]:
    c.execute(sql)

cat_id = {slug: i for i, slug in c.execute("SELECT id, slug FROM Category")}
sub_id = {slug: i for i, slug in c.execute("SELECT id, slug FROM Subcategory")}
added_c = added_s = 0
for ci, t in enumerate(tax["tax"]):
    pos = (ci + 1) * 10
    if t["slug"] in cat_id:
        c.execute('UPDATE Category SET name=?, blurb=?, "group"=?, position=? WHERE id=?', (t["name"], t["blurb"], t["group"], pos, cat_id[t["slug"]]))
    else:
        cat_id[t["slug"]] = cuid()
        c.execute('INSERT INTO Category (id, name, slug, blurb, hue, "group", position) VALUES (?,?,?,?,?,?,?)', (cat_id[t["slug"]], t["name"], t["slug"], t["blurb"], t["hue"], t["group"], pos))
        added_c += 1
    for si, s in enumerate(t["subs"]):
        spos = (si + 1) * 10
        if s["slug"] in sub_id:
            c.execute("UPDATE Subcategory SET name=?, position=?, categoryId=? WHERE id=?", (s["name"], spos, cat_id[t["slug"]], sub_id[s["slug"]]))
        else:
            sub_id[s["slug"]] = cuid()
            c.execute("INSERT INTO Subcategory (id, name, slug, categoryId, position) VALUES (?,?,?,?,?)", (sub_id[s["slug"]], s["name"], s["slug"], cat_id[t["slug"]], spos))
            added_s += 1

moved = 0
for old, dest in tax["moved"].items():
    if old not in sub_id:
        continue
    moved += c.execute("UPDATE Lot SET categoryId=?, subcategoryId=? WHERE subcategoryId=?", (cat_id[dest["category"]], sub_id[dest["slug"]], sub_id[old])).rowcount
    c.execute("DELETE FROM Subcategory WHERE id=?", (sub_id.pop(old),))

seller_id, location = c.execute("SELECT id, location FROM Seller LIMIT 1").fetchone()
existing = {s for (s,) in c.execute("SELECT slug FROM Lot")}
now = int(time.time() * 1000)
inserted = 0
for l in samples:
    if l["slug"] in existing:
        continue
    lid = cuid()
    c.execute(
        """INSERT INTO Lot (id, slug, title, description, condition, priceCents, msrpCents, units, palletCount, weightLbs, shipsFrom,
             available, status, featured, views, lotSize, source, images, createdAt, categoryId, subcategoryId, sellerId, brand)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'ACTIVE',?,?,?,?,'',?,?,?,?,?)""",
        (lid, l["slug"], l["title"], l["description"], l["condition"], l["priceCents"], l["msrpCents"], l["units"], l["palletCount"], l["weightLbs"], location,
         l["available"], 1 if l["featured"] else 0, l["views"], l["lotSize"], l["source"], now - l["daysAgo"] * 86400000,
         cat_id[l["category"]], sub_id.get(l["subcategory"]), seller_id, l["brand"]),
    )
    for m in l["manifest"]:
        c.execute("INSERT INTO ManifestItem (id, lotId, sku, name, qty, unitMsrpCents) VALUES (?,?,?,?,?,?)", (cuid(), lid, m["sku"], m["name"], m["qty"], m["unitMsrpCents"]))
    inserted += 1

c.commit()
print(f"categories +{added_c}, subcategories +{added_s}, lots moved {moved}, sample lots +{inserted}")
print("totals:", c.execute("SELECT (SELECT count(*) FROM Category), (SELECT count(*) FROM Subcategory), (SELECT count(*) FROM Lot)").fetchone())
