import "server-only";

import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import { readSession, type SessionAdmin } from "./session";

/*
 * The data access layer for authorisation. Every admin page, Server Action and Route Handler
 * calls one of these on the server; hiding links in the UI is never the protection.
 */

export type CurrentAdmin = SessionAdmin & {
  /** True until the seeded initial password has been changed. */
  usingInitialPassword: boolean;
};

/** The signed-in administrator, or null. Read once per request. */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await readSession();
  if (!session) return null;
  return { ...session, usingInitialPassword: session.passwordChangedAt === null };
});

/** The signed-in administrator; anyone else is sent to the login page. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** What the browser may see of the administrator: never hashes, tokens or session ids. */
export function publicAdmin(admin: CurrentAdmin) {
  return { email: admin.email, name: admin.name, usingInitialPassword: admin.usingInitialPassword };
}

export type PublicAdmin = ReturnType<typeof publicAdmin>;

/**
 * The signed-in administrator's name and email for the panel's top bar. Private-cached: the
 * server still reads the session on every request, but the browser can keep the result for a
 * few minutes, so moving between admin pages shows the account menu without waiting. Use it for
 * display only; pages and actions authorise with requireAdmin().
 */
export async function getAdminIdentity(): Promise<PublicAdmin | null> {
  "use cache: private";
  cacheLife("minutes");
  const admin = await readSession();
  return admin
    ? {
        email: admin.email,
        name: admin.name,
        usingInitialPassword: admin.passwordChangedAt === null,
      }
    : null;
}
