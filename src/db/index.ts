import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let queryClient: postgres.Sql | null = null;
let dbClient: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("Server is missing DATABASE_URL configuration.");
  }
  return databaseUrl;
};

/**
 * Lazily-constructed Drizzle client over a postgres.js pool. `max: 1` and
 * `prepare: false` keep us friendly to Neon's PgBouncer pooler in serverless
 * (Vercel) environments.
 */
export const getDb = () => {
  if (dbClient) return dbClient;

  queryClient = postgres(getDatabaseUrl(), {
    // Integration tests exercise locks through independent connections.
    max: process.env.NODE_ENV === "test" ? 4 : 1,
    prepare: false,
  });
  dbClient = drizzle(queryClient, { schema });
  return dbClient;
};

export const closeDb = async () => {
  if (!queryClient) return;
  await queryClient.end();
  queryClient = null;
  dbClient = null;
};
