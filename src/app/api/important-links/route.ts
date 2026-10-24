import { connection } from "next/server";

import { getPublishedImportantLinks } from "@/lib/cms/resources/important-links";

/**
 * The published "Important Links" for the site's menu (see
 * src/components/layout/useImportantLinks.ts). Read at request time through the cached query,
 * which the admin panel refreshes. Browsers must not keep their own copy, or a change would only
 * show after a later reload.
 */
export async function GET() {
  await connection(); // never prerendered: the build has no database

  try {
    return Response.json(
      { links: await getPublishedImportantLinks() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Important links: could not load them", error);
    return Response.json({ links: [] }, { status: 503 });
  }
}
