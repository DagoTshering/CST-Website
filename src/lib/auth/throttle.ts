import "server-only";

import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";

import { getDb, schema } from "@/lib/db";

const { loginAttempts } = schema;

/*
 * Throttles repeated failed logins: at most MAX_PER_EMAIL failures for one email, and
 * MAX_PER_IP from one client address, in WINDOW_MS. A successful login clears that email's
 * failures. Kept in PostgreSQL so it survives restarts.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 25;

/**
 * The client address. X-Forwarded-For can be set by the client unless a trusted reverse proxy
 * overwrites it, so in production put the app behind one (see README).
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 64);
}

export async function isLoginThrottled(email: string, ip: string): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - WINDOW_MS);
  const failed = (column: typeof loginAttempts.email | typeof loginAttempts.ip, value: string) =>
    db
      .select({ n: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(column, value),
          eq(loginAttempts.succeeded, false),
          gt(loginAttempts.createdAt, since),
        ),
      );

  const [[byEmail], [byIp]] = await Promise.all([
    failed(loginAttempts.email, email),
    failed(loginAttempts.ip, ip),
  ]);
  return byEmail.n >= MAX_PER_EMAIL || byIp.n >= MAX_PER_IP;
}

export async function recordLoginAttempt(email: string, ip: string, succeeded: boolean) {
  const db = getDb();
  await db.insert(loginAttempts).values({ email, ip, succeeded });
  if (succeeded) {
    await db
      .delete(loginAttempts)
      .where(and(eq(loginAttempts.email, email), eq(loginAttempts.succeeded, false)));
  }
  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
