import "server-only";

import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalMediaId, optionalText, requiredDate, requiredText, status } from "../validation";
import { asField, loadPreview } from "./shared";

const { announcements, media } = schema;

export const ANNOUNCEMENTS_TAG = "cms:announcements";

/** How many notices the homepage lists. */
const HOMEPAGE_LIMIT = 4;

const announcementSchema = z.object({
  title: requiredText("Title", 300),
  summary: optionalText("Content", 4000),
  publishedOn: requiredDate("Publication date"),
  category: optionalText("Category", 60),
  attachmentId: optionalMediaId,
  status,
});

type AnnouncementInput = z.output<typeof announcementSchema>;

export const announcementFields: FieldDef[] = [
  { kind: "text", name: "title", label: "Title", required: true, maxLength: 300 },
  {
    kind: "date",
    name: "publishedOn",
    label: "Publication date",
    required: true,
    width: "half",
  },
  {
    kind: "text",
    name: "category",
    label: "Category",
    maxLength: 60,
    width: "half",
    placeholder: "Admission",
  },
  {
    kind: "textarea",
    name: "summary",
    label: "Content or summary",
    maxLength: 4000,
    rows: 6,
  },
  {
    kind: "document",
    name: "attachmentId",
    label: "Document",
    help: "Optional PDF. When attached, the notice on the homepage opens it.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const announcementResource: ResourceDef<AnnouncementInput> = {
  singular: "announcement",
  basePath: "/admin/announcements",
  tag: ANNOUNCEMENTS_TAG,
  schema: announcementSchema,
  media: (data) => [{ field: "attachmentId", id: data.attachmentId, kind: "document" }],
  create: async (tx, data) => {
    await tx.insert(announcements).values(data);
  },
  update: async (tx, id, data) =>
    (
      await tx
        .update(announcements)
        .set(data)
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

export async function listAnnouncements() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: announcements.id,
      title: announcements.title,
      category: announcements.category,
      publishedOn: announcements.publishedOn,
      attachmentId: announcements.attachmentId,
      status: announcements.status,
      updatedAt: announcements.updatedAt,
    })
    .from(announcements)
    .orderBy(desc(announcements.publishedOn), desc(announcements.id));
  return rows.map(({ attachmentId, ...row }) => ({ ...row, hasAttachment: attachmentId !== null }));
}

export async function getAnnouncementForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(announcements).where(eq(announcements.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      title: row.title,
      summary: asField(row.summary),
      publishedOn: row.publishedOn,
      category: asField(row.category),
      attachmentId: asField(row.attachmentId),
      status: row.status,
    },
    media: { attachmentId: await loadPreview(row.attachmentId) },
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
      publishedOn: announcements.publishedOn,
      category: announcements.category,
      attachmentKey: media.storageKey,
    })
    .from(announcements)
    .leftJoin(media, eq(media.id, announcements.attachmentId))
    .where(eq(announcements.status, "published"))
    .orderBy(desc(announcements.publishedOn), desc(announcements.id))
    .limit(HOMEPAGE_LIMIT);

  return rows.map(({ attachmentKey, ...row }) => ({
    ...row,
    documentUrl: attachmentKey ? mediaUrl(attachmentKey) : null,
  }));
}
