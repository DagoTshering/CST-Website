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
 * Programme, vacancy and announcement pages are generated on their first request and then kept
 * (see the pages), so an address that is not a published programme or post is answered here with the 404
 * page made at build time, rather than having a page generated and stored for every address
 * anyone tries. A vacancy post's earlier address redirects to its page.
 */
const PAGES = {
  programmes: { table: sql`programmes`, maxLength: 80 },
  vacancies: { table: sql`vacancies`, maxLength: 160 },
  announcements: { table: sql`announcements`, maxLength: 160 },
} as const;

async function published(request: NextRequest, section: keyof typeof PAGES, slug: string) {
  const { table, maxLength } = PAGES[section];
  const missing = () => NextResponse.rewrite(new URL(`/${section}/_`, request.url));
  // a web address is only ever lower-case letters, digits and hyphens
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > maxLength) return missing();
  try {
    const [row] = await getDb().execute<{ found: boolean }>(sql`
      select exists (
        select 1 from ${table} where slug = ${slug} and status = 'published'
      ) as found
    `);
    if (row?.found) return NextResponse.next();
    if (section === "vacancies") {
      // an address a post had before its address was changed: on to its page, for good
      const [moved] = await getDb().execute<{ slug: string }>(sql`
        select v.slug from vacancy_slug_redirects r
        join vacancies v on v.id = r.vacancy_id
        where r.slug = ${slug} and v.status = 'published'
      `);
      if (moved)
        return NextResponse.redirect(new URL(`/vacancies/${moved.slug}`, request.url), 308);
    }
  } catch (error) {
    // the page reports a database failure itself; only a definite "no" is answered here
    console.error(`Proxy: could not look up a page in ${section}`, error);
    return NextResponse.next();
  }
  return missing();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return admin(request);

  const [, section, slug] =
    /^\/(programmes|vacancies|announcements)\/([^/]+)$/.exec(pathname) ?? [];
  if (slug !== undefined && slug !== "_") {
    return published(request, section as keyof typeof PAGES, slug);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/programmes/:slug",
    "/vacancies/:slug",
    "/announcements/:slug",
  ],
};
