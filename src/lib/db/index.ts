import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

/**
 * The client is cached on `globalThis` so that Next.js hot reloads in development
 * reuse the same connection pool instead of opening a new one on every edit.
 */
const globalForDb = globalThis as typeof globalThis & { __db?: Database };

const POOL_SIZE = process.env.NODE_ENV === "production" ? 10 : 5;

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }

  const client = postgres(url, {
    max: POOL_SIZE,
    connect_timeout: 10,
    // Connections stay open rather than closing when idle (or after a random lifetime). Opening
    // a connection calls Math.random(), which Next.js does not allow while it prerenders a page;
    // with the pool opened at startup (openDbPool) and kept, pages only ever borrow a connection.
    idle_timeout: 0,
    max_lifetime: 0,
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

/**
 * Opens every connection in the pool. Called once at server startup (src/instrumentation.ts),
 * outside any request, so no page render ever has to open one. Queries sent together, while no
 * connection is open yet, each open a connection of their own.
 */
export async function openDbPool() {
  const { $client } = getDb();
  await Promise.all(Array.from({ length: POOL_SIZE }, () => $client`select 1`));
}

export { schema };
