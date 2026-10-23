import "server-only";

import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";
import { excerptOf, plainText, sanitizeDocument, type RichNode } from "@/lib/rich-text";
import { slugify } from "@/lib/vacancies";

import type { ResourceDef, Tx } from "../crud";
import type { FormInitial } from "../form";
import { optionalMediaId, optionalText, requiredDate, requiredText } from "../validation";
import { loadPreview } from "./shared";

/*
 * Announcements: general college notices, on the homepage and the Announcements page
 * (/announcements, with a page per notice). Job recruitment notices are a separate feature
 * (vacancies.ts) and are never stored here.
 */

const { announcements, media } = schema;

export const ANNOUNCEMENTS_TAG = "cms:announcements";

/** How many notices the homepage lists. */
const HOMEPAGE_LIMIT = 4;

/** Notices per page of the Announcements page (after the newest, which is shown large). */
export const ANNOUNCEMENTS_PAGE_SIZE = 12;

/** What each button of the form does to the notice's state. */
const INTENTS = {
  draft: "draft",
  publish: "published",
  update: "published",
  unpublish: "draft",
} as const;

const announcementSchema = z
  .object({
    title: requiredText("Title", 300),
    publishedOn: requiredDate("Publication date"),
    slug: optionalText("Web address", 160).pipe(
      z
        .string()
        .regex(
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          "Use lower-case letters, digits and hyphens, e.g. fee-payment-2026.",
        )
        .nullable(),
    ),
    // the editor's document, as JSON in a hidden field
    content: z
      .string({ error: "The content could not be read. Reload the page and try again." })
      .max(2_000_000, "The content is too long.")
      .transform((value, ctx) => {
        let doc: RichNode | null = null;
        try {
          doc = sanitizeDocument(JSON.parse(value));
        } catch {
          doc = null;
        }
        if (!doc) {
          ctx.addIssue({
            code: "custom",
            message: "The content could not be read, or is too long.",
          });
          return z.NEVER;
        }
        return doc;
      }),
    attachmentId: optionalMediaId,
    intent: z.enum(["draft", "publish", "update", "unpublish"], {
      error: "Choose Save draft or Publish.",
    }),
  })
  .superRefine((data, ctx) => {
    const publishing = data.intent === "publish" || data.intent === "update";
    if (publishing && !plainText(data.content) && !data.attachmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Write the notice, or attach its PDF, before publishing.",
      });
    }
  })
  .transform(({ intent, content, ...data }) => ({
    ...data,
    content,
    summary: excerptOf(content) || null,
    status: INTENTS[intent],
  }));

type AnnouncementInput = z.output<typeof announcementSchema>;

/** A free web address from `base`: base, base-2, base-3… (skipping the notice's own). */
async function freeSlug(tx: Tx, base: string, exceptId: number | null) {
  const root = base || "notice";
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? root : `${root.slice(0, 150)}-${n}`;
    const [taken] = await tx
      .select({ id: announcements.id })
      .from(announcements)
      .where(
        exceptId === null
          ? eq(announcements.slug, slug)
          : and(eq(announcements.slug, slug), ne(announcements.id, exceptId)),
      )
      .limit(1);
    if (!taken) return slug;
  }
  return `${root.slice(0, 140)}-${Date.now().toString(36)}`;
}

export const announcementResource: ResourceDef<AnnouncementInput> = {
  singular: "announcement",
  basePath: "/admin/announcements",
  tag: ANNOUNCEMENTS_TAG,
  schema: announcementSchema,
  media: (data) => [{ field: "attachmentId", id: data.attachmentId, kind: "document" }],
  validate: async (tx, data, id) => {
    // an address typed in must be free; one left empty is made from the title
    if (!data.slug) return null;
    const [taken] = await tx
      .select({ id: announcements.id })
      .from(announcements)
      .where(eq(announcements.slug, data.slug))
      .limit(1);
    return taken && taken.id !== id
      ? { slug: ["Another announcement has this web address. Choose another."] }
      : null;
  },
  create: async (tx, { slug, ...data }) =>
    (
      await tx
        .insert(announcements)
        .values({ ...data, slug: slug ?? (await freeSlug(tx, slugify(data.title), null)) })
        .returning({ id: announcements.id })
    )[0].id,
  update: async (tx, id, { slug, ...data }) =>
    (
      await tx
        .update(announcements)
        .set({ ...data, slug: slug ?? (await freeSlug(tx, slugify(data.title), id)) })
        .where(eq(announcements.id, id))
        .returning({ id: announcements.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(announcements)
        .where(eq(announcements.id, id))
        .returning({ id: announcements.id })
    ).length > 0,
};

// ---------------------------------------------------------------------------- admin

export async function listAnnouncements() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: announcements.id,
      title: announcements.title,
      publishedOn: announcements.publishedOn,
      attachmentId: announcements.attachmentId,
      status: announcements.status,
      updatedAt: announcements.updatedAt,
    })
    .from(announcements)
    .orderBy(desc(announcements.publishedOn), desc(announcements.id));
  return rows.map(({ attachmentId, ...row }) => ({ ...row, hasAttachment: attachmentId !== null }));
}

export type AnnouncementForm = FormInitial & {
  status: "draft" | "published";
  slug: string;
  content: RichNode;
};

export async function getAnnouncementForm(id: number): Promise<AnnouncementForm | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      title: row.title,
      publishedOn: row.publishedOn,
      slug: row.slug,
    },
    media: { attachmentId: await loadPreview(row.attachmentId) },
    content: sanitizeDocument(row.content) ?? { type: "doc", content: [] },
    status: row.status,
    slug: row.slug,
  };
}

/** A notice as it is saved, draft or published, for the admin's preview page (never cached). */
export async function getAnnouncementPreview(id: number) {
  await requireAdmin();
  const [row] = await getDb()
    .select({
      title: announcements.title,
      slug: announcements.slug,
      content: announcements.content,
      publishedOn: announcements.publishedOn,
      status: announcements.status,
      attachment: { storageKey: media.storageKey, name: media.originalName, size: media.byteSize },
    })
    .from(announcements)
    .leftJoin(media, eq(media.id, announcements.attachmentId))
    .where(eq(announcements.id, id))
    .limit(1);
  return row ? toNotice(row) : null;
}

// ---------------------------------------------------------------------------- public

const published = eq(announcements.status, "published");

function toNotice<
  T extends {
    content: unknown;
    attachment: { storageKey: string | null; name: string | null; size: number | null } | null;
  },
>(row: T) {
  return {
    ...row,
    content: sanitizeDocument(row.content) ?? { type: "doc", content: [] },
    attachment: row.attachment?.storageKey
      ? {
          url: mediaUrl(row.attachment.storageKey),
          name: row.attachment.name ?? "notice.pdf",
          size: row.attachment.size ?? 0,
        }
      : null,
  };
}

/** The latest published notices for the homepage, newest first. */
export async function getPublishedAnnouncements() {
  "use cache";
  cacheTag(ANNOUNCEMENTS_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select({
      id: announcements.id,
      title: announcements.title,
      slug: announcements.slug,
      publishedOn: announcements.publishedOn,
      attachmentKey: media.storageKey,
    })
    .from(announcements)
    .leftJoin(media, eq(media.id, announcements.attachmentId))
    .where(published)
    .orderBy(desc(announcements.publishedOn), desc(announcements.id))
    .limit(HOMEPAGE_LIMIT);

  return rows.map(({ attachmentKey, ...row }) => ({
    ...row,
    documentUrl: attachmentKey ? mediaUrl(attachmentKey) : null,
  }));
}

/** A page of the Announcements page: its notices (newest first), and the latest titles for the ticker. */
export async function getAnnouncementsPage(page: number) {
  "use cache";
  cacheTag(ANNOUNCEMENTS_TAG);
  cacheLife("hours");

  const db = getDb();
  const where = published;
  const [items, [{ total }], latest] = await Promise.all([
    db
      .select({
        title: announcements.title,
        slug: announcements.slug,
        summary: announcements.summary,
        publishedOn: announcements.publishedOn,
        hasAttachment: sql<boolean>`${announcements.attachmentId} is not null`,
      })
      .from(announcements)
      .where(where)
      .orderBy(desc(announcements.publishedOn), desc(announcements.id))
      .limit(ANNOUNCEMENTS_PAGE_SIZE + (page === 1 ? 1 : 0))
      .offset(page === 1 ? 0 : (page - 1) * ANNOUNCEMENTS_PAGE_SIZE + 1),
    db.select({ total: count() }).from(announcements).where(where),
    db
      .select({
        title: announcements.title,
        slug: announcements.slug,
        publishedOn: announcements.publishedOn,
      })
      .from(announcements)
      .where(published)
      .orderBy(desc(announcements.publishedOn), desc(announcements.id))
      .limit(8),
  ]);
  const [{ all }] = await db.select({ all: count() }).from(announcements).where(published);
  return {
    items,
    total,
    all,
    // the first page shows the newest large, then a page's worth
    pages: Math.max(1, Math.ceil(Math.max(0, total - 1) / ANNOUNCEMENTS_PAGE_SIZE)),
    latest,
  };
}

/** A published notice by its web address, or null. */
export async function getPublishedAnnouncement(slug: string) {
  "use cache";
  cacheTag(ANNOUNCEMENTS_TAG);
  cacheLife("hours");

  const [row] = await getDb()
    .select({
      title: announcements.title,
      slug: announcements.slug,
      content: announcements.content,
      summary: announcements.summary,
      publishedOn: announcements.publishedOn,
      attachment: { storageKey: media.storageKey, name: media.originalName, size: media.byteSize },
    })
    .from(announcements)
    .leftJoin(media, eq(media.id, announcements.attachmentId))
    .where(and(published, eq(announcements.slug, slug)))
    .limit(1);
  return row ? toNotice(row) : null;
}

export type Notice = NonNullable<Awaited<ReturnType<typeof getPublishedAnnouncement>>>;
