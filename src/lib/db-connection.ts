const READ_OPERATIONS = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow",
  "findMany", "count", "aggregate", "groupBy",
]);

export function connectionUrl(value: string | undefined) {
  if (!value) return value;
  const url = new URL(value);
  if (url.hostname.endsWith(".neon.tech")) {
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "20");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  }
  return url.toString();
}

/** One bounded retry for reads that fail before establishing a database connection. */
export async function readWithConnectionRetry<T>(operation: string, query: () => Promise<T>, wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))): Promise<T> {
  try {
    return await query();
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (!READ_OPERATIONS.has(operation) || (code !== "P1001" && code !== "P1002")) throw error;
    await wait(500);
    return query();
  }
}
