import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { getDb } from "@/lib/db";

/**
 * Admin pages: an optimistic check only. Visitors without a session cookie are sent to the login
 * page before any admin page renders. Whether the session is real is checked on the server by
 * every admin page, Server Action and Route Handler (see src/lib/auth/dal.ts).
 */
function admin(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login" || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

/**
 * Programme pages are generated on their first request and then kept (see the page), so an
 * address that is not a published programme is answered here with the 404 page made at build
 * time, rather than having a page generated and stored for every address anyone tries.
 */
async function programme(request: NextRequest, slug: string) {
  // a web address is only ever lower-case letters, digits and hyphens (see programmes.ts)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return NextResponse.rewrite(new URL("/programmes/_", request.url));
  }
  try {
    const [row] = await getDb().execute<{ found: boolean }>(sql`
      select exists (
        select 1 from programmes where slug = ${slug} and status = 'published'
      ) as found
    `);
    if (row?.found) return NextResponse.next();
  } catch (error) {
    // the page reports a database failure itself; only a definite "no" is answered here
    console.error("Proxy: could not look up a programme", error);
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/programmes/_", request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return admin(request);

  const slug = /^\/programmes\/([^/]+)$/.exec(pathname)?.[1];
  if (slug !== undefined && slug !== "_") return programme(request, slug);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/programmes/:slug"],
};
