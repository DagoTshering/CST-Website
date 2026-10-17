import { eq, sql } from "drizzle-orm";
import { connection } from "next/server";

import { getCurrentAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { readStoredFile } from "@/lib/media/storage";
import { STORAGE_KEY_PATTERN } from "@/lib/media/url";

/*
 * Serves uploaded files. Anyone may fetch a file that published content uses; any other file
 * (a draft's image, something not yet attached) is served only to a signed-in administrator.
 * Everyone else gets a 404, which does not reveal whether the file exists.
 */

const notFound = () => new Response("Not found", { status: 404 });

/** Whether any published content points at the file. */
async function isUsedByPublishedContent(mediaId: string) {
  const [row] = await getDb().execute<{ used: boolean }>(sql`
    select (
      exists (select 1 from facilities where image_id = ${mediaId} and status = 'published')
      or exists (select 1 from programmes where image_id = ${mediaId} and status = 'published')
      or exists (select 1 from events where image_id = ${mediaId} and status = 'published')
      or exists (select 1 from leaders where portrait_id = ${mediaId} and status = 'published')
      or exists (select 1 from announcements where attachment_id = ${mediaId} and status = 'published')
      or exists (select 1 from about_section where image_id = ${mediaId} and status = 'published')
    ) as used
  `);
  return Boolean(row?.used);
}

/** "Fees 2027.pdf" -> a Content-Disposition value that is safe for any name. */
function disposition(name: string) {
  const ascii = name.replace(/[^\x20-\x7E]|["\\]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(_request: Request, ctx: RouteContext<"/media/[file]">) {
  await connection();

  const { file } = await ctx.params;
  if (!STORAGE_KEY_PATTERN.test(file)) return notFound();

  const [item] = await getDb()
    .select()
    .from(schema.media)
    .where(eq(schema.media.storageKey, file))
    .limit(1);
  if (!item) return notFound();

  const isPublic = await isUsedByPublishedContent(item.id);
  if (!isPublic && !(await getCurrentAdmin())) return notFound();

  const data = await readStoredFile(item.storageKey);
  if (!data) return notFound();

  const headers = new Headers({
    "Content-Type": item.mimeType,
    "Content-Length": String(data.length),
    "Content-Disposition": disposition(item.originalName),
    "X-Content-Type-Options": "nosniff",
    // Short public caching, so unpublishing takes effect soon; drafts are never cached.
    "Cache-Control": isPublic ? "public, max-age=300" : "private, no-store",
  });
  // An image opened directly can never run anything. (Not for PDFs: browsers' PDF viewers do
  // not work in a sandboxed document.)
  if (item.kind === "image") {
    headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
  }

  return new Response(new Uint8Array(data), { headers });
}
