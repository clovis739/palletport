/**
 * Case-insensitive text matching for Prisma filters: `{ contains: q, ...CI }`.
 * Postgres (Neon) compares case-sensitively unless `mode: "insensitive"` is set; SQLite is already
 * case-insensitive for ASCII and rejects `mode`, so it's only added for Postgres connection strings.
 */
const isPostgres = /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");

export const CI = (isPostgres ? { mode: "insensitive" } : {}) as { mode?: "insensitive" };
