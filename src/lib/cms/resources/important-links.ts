import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { requiredLink, requiredText, status } from "../validation";

/*
 * The "Important Links" under "Others" in the site's menu. The menu loads them in the browser
 * from /api/important-links (see src/components/layout/useImportantLinks.ts), because the menu is
 * part of pages that are prerendered whole, without a database.
 */

const { importantLinks } = schema;

export const IMPORTANT_LINKS_TAG = "cms:important-links";

const linkSchema = z.object({
  label: requiredText("Label", 80),
  url: requiredLink("Link"),
  status,
});

type LinkInput = z.output<typeof linkSchema>;

export const importantLinkFields: FieldDef[] = [
  {
    kind: "text",
    name: "label",
    label: "Label",
    required: true,
    maxLength: 80,
    width: "half",
    placeholder: "Hostel Booking",
    help: "The text shown in the menu.",
  },
  {
    kind: "text",
    name: "url",
    label: "Link",
    required: true,
    maxLength: 500,
    width: "half",
    placeholder: "https://hostel.cst.edu.bt/",
    help: "A full web address, which opens in a new tab, or a page of this site such as /downloads.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const importantLinkResource: ResourceDef<LinkInput> = {
  singular: "link",
  basePath: "/admin/important-links",
  tag: IMPORTANT_LINKS_TAG,
  schema: linkSchema,
  validate: async (tx, data, id) => {
    const [taken] = await tx
      .select({ id: importantLinks.id })
      .from(importantLinks)
      .where(
        id === null
          ? eq(importantLinks.url, data.url)
          : and(eq(importantLinks.url, data.url), ne(importantLinks.id, id)),
      )
      .limit(1);
    return taken ? { url: ["This link is already in the list."] } : null;
  },
  ordering: { key: "importantLinks", group: () => "all" },
  create: async (tx, data) =>
    (await tx.insert(importantLinks).values(data).returning({ id: importantLinks.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(importantLinks)
        .set(data)
        .where(eq(importantLinks.id, id))
        .returning({ id: importantLinks.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(importantLinks)
        .where(eq(importantLinks.id, id))
        .returning({ id: importantLinks.id })
    ).length > 0,
};

export async function listImportantLinks() {
  await requireAdmin();
  return getDb()
    .select({
      id: importantLinks.id,
      label: importantLinks.label,
      url: importantLinks.url,
      status: importantLinks.status,
      updatedAt: importantLinks.updatedAt,
    })
    .from(importantLinks)
    .orderBy(asc(importantLinks.sortOrder), asc(importantLinks.label), asc(importantLinks.id));
}

export async function getImportantLinkForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(importantLinks)
    .where(eq(importantLinks.id, id))
    .limit(1);
  if (!row) return null;
  return { values: { label: row.label, url: row.url, status: row.status }, media: {} };
}

/** The published links, in order, for the menu. */
export async function getPublishedImportantLinks() {
  "use cache";
  cacheTag(IMPORTANT_LINKS_TAG);
  cacheLife("hours");

  return getDb()
    .select({ label: importantLinks.label, href: importantLinks.url })
    .from(importantLinks)
    .where(eq(importantLinks.status, "published"))
    .orderBy(asc(importantLinks.sortOrder), asc(importantLinks.label), asc(importantLinks.id));
}
