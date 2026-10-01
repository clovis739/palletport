"""
Exports every table of the local SQLite database (prisma/dev.db) to prisma/export.json, for
scripts/import-data.ts to load into Postgres (Neon). Read-only: dev.db is not changed.

    python scripts/export-sqlite.py [path/to/dev.db] [path/to/export.json]

The export contains customer records and password hashes: it is git-ignored, don't share it.
"""
import json
import sqlite3
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "prisma/dev.db"
out = sys.argv[2] if len(sys.argv) > 2 else "prisma/export.json"

con = sqlite3.connect(f"file:{src}?mode=ro", uri=True)
con.row_factory = sqlite3.Row
tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name")]
data = {}
for t in tables:
    rows = [dict(r) for r in con.execute(f'SELECT * FROM "{t}"')]
    data[t] = rows
    print(f"{t}: {len(rows)}")
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)
print(f"→ {out}")
