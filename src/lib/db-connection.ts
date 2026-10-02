const READ_OPERATIONS = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow",
  "findMany", "count", "aggregate", "groupBy",
]);
const TRANSIENT_CONNECTION_ERRORS = new Set(["P1001", "P1002", "P1017", "P2024"]);

export function connectionUrl(value: string | undefined) {
  if (!value) return value;
  const url = new URL(value);
  if (url.hostname.endsWith(".neon.tech")) {
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "20");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
    if (!url.searchParams.has("max_idle_connection_lifetime")) url.searchParams.set("max_idle_connection_lifetime", "60");
  }
  return url.toString();
}

/** One bounded retry for read-only queries after a transient connection or pool failure. */
export async function readWithConnectionRetry<T>(operation: string, query: () => Promise<T>, wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))): Promise<T> {
  try {
    return await query();
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (!READ_OPERATIONS.has(operation) || typeof code !== "string" || !TRANSIENT_CONNECTION_ERRORS.has(code)) throw error;
    await wait(500);
    return query();
  }
}
