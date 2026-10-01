import { PrismaClient } from "@prisma/client";
import { connectionUrl, readWithConnectionRetry } from "./db-connection";

function createClient() {
  return new PrismaClient({ datasourceUrl: connectionUrl(process.env.DATABASE_URL) }).$extends({
    query: {
      $allModels: {
        $allOperations({ operation, args, query }) {
          return readWithConnectionRetry(operation, () => query(args));
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { resilientPrisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.resilientPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.resilientPrisma = db;
