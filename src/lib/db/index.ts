import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

/**
 * The client is cached on `globalThis` so that Next.js hot reloads in development
 * reuse the same connection pool instead of opening a new one on every edit.
 */
const globalForDb = globalThis as typeof globalThis & { __db?: Database };

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }

  const client = postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle({ client, schema });
}

/**
 * Returns the shared Drizzle instance. Creation is lazy so that importing this
 * module (for example during `next build`) never requires a database connection.
 * Server-side only: never import this from a Client Component.
 */
export function getDb(): Database {
  if (!globalForDb.__db) {
    globalForDb.__db = createDb();
  }
  return globalForDb.__db;
}

export { schema };
