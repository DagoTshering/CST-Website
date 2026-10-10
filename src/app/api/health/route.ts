import { sql } from "drizzle-orm";
import { connection } from "next/server";

import { getDb } from "@/lib/db";

/**
 * Infrastructure health check: confirms the app is running and can reach
 * PostgreSQL through Drizzle. Used by the Docker Compose health check.
 */
export async function GET() {
  await connection(); // always evaluate at request time, never prerender

  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "up" });
  } catch (error) {
    console.error("Health check: database unreachable", error);
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}
