import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb, schema } from "@/lib/db";

import { SESSION_COOKIE } from "./cookie";

const { adminSessions, adminUsers } = schema;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours, then sign in again

/** The token in the cookie is never stored; the database keeps only its hash. */
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Starts a session for the administrator and sets the HTTP-only session cookie. */
export async function createSession(adminId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const db = getDb();

  await db.insert(adminSessions).values({ id: hashToken(token), adminId, expiresAt });
  // Expired sessions are tidied up whenever someone signs in.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionAdmin = {
  sessionId: string;
  id: number;
  email: string;
  name: string | null;
  passwordChangedAt: Date | null;
};

/** Looks up the session in the cookie. Returns null when it is missing, unknown or expired. */
export async function readSession(): Promise<SessionAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const sessionId = hashToken(token);
  const [row] = await getDb()
    .select({
      sessionId: adminSessions.id,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      passwordChangedAt: adminUsers.passwordChangedAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminId))
    // The database's clock, not new Date(): Next.js prerenders signed-in pages for prefetching,
    // where reading the current time in JavaScript is not allowed.
    .where(and(eq(adminSessions.id, sessionId), gt(adminSessions.expiresAt, sql`now()`)))
    .limit(1);

  return row ?? null;
}

/** Ends the current session in the database and clears the cookie. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb()
      .delete(adminSessions)
      .where(eq(adminSessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Signs the administrator out everywhere except the given session (after a password change). */
export function otherSessionsOf(adminId: number, keepSessionId: string) {
  return and(eq(adminSessions.adminId, adminId), ne(adminSessions.id, keepSessionId));
}
