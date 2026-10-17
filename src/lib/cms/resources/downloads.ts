import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import { ActionError, type ResourceDef, type Tx } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  optionalDate,
  optionalMediaId,
  optionalText,
  requiredText,
  sortOrder,
  status,
} from "../validation";
import { PROGRAMMES_TAG } from "./programmes";
import { asField, loadPreview } from "./shared";

const { downloadCategories, downloads, media, programmes, seedTombstones } = schema;

/** Tag of the Downloads page's cached data; categories and downloads both feed it. */
export const DOWNLOADS_TAG = "cms:downloads";

/** The tombstone key of an imported download (see seedTombstones). */
export const legacyTombstone = (legacyKey: string) => `download:${legacyKey}`;

// ---------------------------------------------------------------------------- downloads

const downloadSchema = z
  .object({
    title: requiredText("Title", 300),
    description: optionalText("Description", 1000),
    categoryId: z
      .string({ error: "Choose a category." })
      .regex(/^\d{1,9}$/, "Choose a category.")
      .transform(Number),
    groupLabel: optionalText("Group", 120),
    programmeId: z
      .string()
      .optional()
      .transform((value) => (value && /^\d{1,9}$/.test(value) ? Number(value) : null)),
    kind: z.enum(["file", "link"], { error: "Choose a file or a link." }),
    fileId: optionalMediaId,
    externalUrl: optionalText("Link", 2000),
    publishedOn: optionalDate("Date"),
    sortOrder,
    status,
  })
  .superRefine((data, ctx) => {
    if (data.kind === "file" && !data.fileId) {
      ctx.addIssue({ code: "custom", path: ["fileId"], message: "Upload a PDF." });
    }
    if (data.kind === "link") {
      let url: URL | null = null;
      try {
        url = data.externalUrl ? new URL(data.externalUrl) : null;
      } catch {
        url = null;
      }
      if (!url || url.protocol !== "https:") {
        ctx.addIssue({
          code: "custom",
          path: ["externalUrl"],
          message: "Enter a full web address starting with https://",
        });
      }
    }
  })
  // Only what belongs to the chosen kind is stored.
  .transform((data) => ({
    ...data,
    fileId: data.kind === "file" ? data.fileId : null,
    externalUrl: data.kind === "link" ? data.externalUrl : null,
  }));

type DownloadInput = z.output<typeof downloadSchema>;

type CategoryOption = { id: number; name: string; groupByProgramme: boolean };
type ProgrammeOption = { id: number; name: string; status: "draft" | "published" };

/**
 * The form's fields; categories and programmes come from the database. In a category grouped by
 * programme (the students' project reports) a programme must be chosen; elsewhere an optional
 * group heading can be typed.
 */
export function downloadFields(
  categories: CategoryOption[],
  programmeOptions: ProgrammeOption[],
): FieldDef[] {
  const byProgramme = categories.filter((c) => c.groupByProgramme).map((c) => String(c.id));
  return [
    { kind: "text", name: "title", label: "Title", required: true, maxLength: 300 },
    {
      kind: "select",
      name: "categoryId",
      label: "Category",
      required: true,
      width: "half",
      options: categories.map((c) => ({ value: String(c.id), label: c.name })),
    },
    {
      kind: "select",
      name: "programmeId",
      label: "Programme",
      required: true,
      width: "half",
      options: programmeOptions.map((p) => ({
        value: String(p.id),
        label: p.status === "draft" ? `${p.name} (draft)` : p.name,
      })),
      help: "Listed under this programme on the Downloads page.",
      showWhen: { field: "categoryId", oneOf: byProgramme },
    },
    {
      kind: "text",
      name: "groupLabel",
      label: "Group",
      maxLength: 120,
      width: "half",
      help: "Optional heading within the category.",
      showWhen: { field: "categoryId", oneOf: byProgramme, not: true },
    },
    {
      kind: "select",
      name: "kind",
      label: "Type",
      required: true,
      width: "half",
      options: [
        { value: "file", label: "PDF file" },
        { value: "link", label: "Link (e.g. a Google Drive folder)" },
      ],
    },
    {
      kind: "date",
      name: "publishedOn",
      label: "Date",
      width: "half",
      help: "Optional. Shown beside the title.",
    },
    {
      kind: "document",
      name: "fileId",
      label: "PDF file",
      required: true,
      help: "PDF, up to 100 MB.",
      showWhen: { field: "kind", oneOf: ["file"] },
    },
    {
      kind: "text",
      name: "externalUrl",
      label: "Link",
      required: true,
      maxLength: 2000,
      placeholder: "https://drive.google.com/drive/folders/…",
      showWhen: { field: "kind", oneOf: ["link"] },
    },
    { kind: "textarea", name: "description", label: "Description", maxLength: 1000, rows: 3 },
    {
      kind: "number",
      name: "sortOrder",
      label: "Display order",
      min: 0,
      max: 9999,
      width: "half",
      help: "Lower numbers appear first within the category.",
    },
    { kind: "status", name: "status", label: "Status", width: "half" },
  ];
}

async function findCategory(tx: Tx, id: number) {
  const [row] = await tx
    .select({ groupByProgramme: downloadCategories.groupByProgramme })
    .from(downloadCategories)
    .where(eq(downloadCategories.id, id))
    .limit(1);
  return row ?? null;
}

/** What is stored: a programme in a category grouped by programme, a group label elsewhere. */
async function normalise(tx: Tx, data: DownloadInput) {
  const category = await findCategory(tx, data.categoryId);
  return category?.groupByProgramme
    ? { ...data, groupLabel: null }
    : { ...data, programmeId: null };
}

export const downloadResource: ResourceDef<DownloadInput> = {
  singular: "download",
  basePath: "/admin/downloads",
  tag: DOWNLOADS_TAG,
  schema: downloadSchema,
  media: (data) => [{ field: "fileId", id: data.fileId, kind: "document" }],
  validate: async (tx, data): Promise<Record<string, string[]> | null> => {
    const category = await findCategory(tx, data.categoryId);
    if (!category) return { categoryId: ["That category no longer exists. Choose another."] };
    if (!category.groupByProgramme) return null;
    if (!data.programmeId) {
      return { programmeId: ["Choose the programme this belongs to."] };
    }
    const [programme] = await tx
      .select({ id: programmes.id })
      .from(programmes)
      .where(eq(programmes.id, data.programmeId))
      .limit(1);
    return programme ? null : { programmeId: ["That programme no longer exists. Choose another."] };
  },
  create: async (tx, data) => {
    await tx.insert(downloads).values(await normalise(tx, data));
  },
  update: async (tx, id, data) =>
    (
      await tx
        .update(downloads)
        .set(await normalise(tx, data))
        .where(eq(downloads.id, id))
        .returning({ id: downloads.id })
    ).length > 0,
  remove: async (tx, id) => {
    const [row] = await tx
      .delete(downloads)
      .where(eq(downloads.id, id))
      .returning({ legacyKey: downloads.legacyKey });
    if (!row) return false;
    // An imported download stays deleted: the seed will not add it again.
    if (row.legacyKey) {
      await tx
        .insert(seedTombstones)
        .values({ key: legacyTombstone(row.legacyKey) })
        .onConflictDoNothing();
    }
    return true;
  },
};

export async function listCategoryOptions() {
  await requireAdmin();
  return getDb()
    .select({
      id: downloadCategories.id,
      name: downloadCategories.name,
      groupByProgramme: downloadCategories.groupByProgramme,
    })
    .from(downloadCategories)
    .orderBy(asc(downloadCategories.sortOrder), asc(downloadCategories.name));
}

/** Every programme, published or draft, for the Programme dropdown. */
export async function listProgrammeOptions() {
  await requireAdmin();
  return getDb()
    .select({ id: programmes.id, name: programmes.name, status: programmes.status })
    .from(programmes)
    .orderBy(asc(programmes.sortOrder), asc(programmes.name));
}

export async function listDownloads() {
  await requireAdmin();
  return getDb()
    .select({
      id: downloads.id,
      title: downloads.title,
      group: sql<string | null>`coalesce(${programmes.name}, ${downloads.groupLabel})`,
      kind: downloads.kind,
      byteSize: media.byteSize,
      status: downloads.status,
      updatedAt: downloads.updatedAt,
      categoryId: downloadCategories.id,
      category: downloadCategories.name,
    })
    .from(downloads)
    .innerJoin(downloadCategories, eq(downloadCategories.id, downloads.categoryId))
    .leftJoin(media, eq(media.id, downloads.fileId))
    .leftJoin(programmes, eq(programmes.id, downloads.programmeId))
    .orderBy(
      asc(downloadCategories.sortOrder),
      asc(downloadCategories.name),
      sql`${programmes.sortOrder} asc nulls first`,
      asc(downloads.sortOrder),
      asc(downloads.id),
    );
}

export async function getDownloadForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      title: row.title,
      description: asField(row.description),
      categoryId: String(row.categoryId),
      groupLabel: asField(row.groupLabel),
      programmeId: asField(row.programmeId),
      kind: row.kind,
      fileId: asField(row.fileId),
      externalUrl: asField(row.externalUrl),
      publishedOn: asField(row.publishedOn),
      sortOrder: asField(row.sortOrder),
      status: row.status,
    },
    media: { fileId: await loadPreview(row.fileId) },
  };
}

// ---------------------------------------------------------------------------- categories

const categorySchema = z.object({
  name: requiredText("Name", 120),
  description: optionalText("Description", 500),
  grouping: z
    .enum(["heading", "programme"], { error: "Choose how downloads are grouped." })
    .transform((value) => value === "programme"),
  sortOrder,
});

type CategoryInput = z.output<typeof categorySchema>;

/** The form's `grouping` choice as the column it is stored in. */
const categoryRow = ({ grouping, ...data }: CategoryInput) => ({
  ...data,
  groupByProgramme: grouping,
});

export const categoryFields: FieldDef[] = [
  { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    maxLength: 500,
    rows: 2,
    help: "Optional. Shown under the category's heading on the Downloads page.",
  },
  {
    kind: "select",
    name: "grouping",
    label: "Group downloads by",
    required: true,
    options: [
      { value: "heading", label: "An optional heading, typed for each download" },
      { value: "programme", label: "Programme (required for each download)" },
    ],
    help: "With Programme, every download in the category must be filed under a programme, and the Downloads page lists them by programme.",
  },
  {
    kind: "number",
    name: "sortOrder",
    label: "Display order",
    min: 0,
    max: 9999,
    width: "half",
    help: "Lower numbers appear first.",
  },
];

async function nameTaken(tx: Tx, name: string, exceptId?: number) {
  const [row] = await tx
    .select({ id: downloadCategories.id })
    .from(downloadCategories)
    .where(eq(downloadCategories.name, name))
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export const categoryResource: ResourceDef<CategoryInput> = {
  singular: "category",
  basePath: "/admin/downloads/categories",
  tag: DOWNLOADS_TAG,
  schema: categorySchema,
  create: async (tx, data) => {
    if (await nameTaken(tx, data.name)) throw new ActionError("A category with that name exists.");
    await tx.insert(downloadCategories).values(categoryRow(data));
  },
  update: async (tx, id, data) => {
    if (await nameTaken(tx, data.name, id)) {
      throw new ActionError("A category with that name exists.");
    }
    return (
      (
        await tx
          .update(downloadCategories)
          .set(categoryRow(data))
          .where(eq(downloadCategories.id, id))
          .returning({ id: downloadCategories.id })
      ).length > 0
    );
  },
  remove: async (tx, id) => {
    const [{ n }] = await tx
      .select({ n: count() })
      .from(downloads)
      .where(eq(downloads.categoryId, id));
    if (n > 0) {
      throw new ActionError(
        `This category still has ${n} download${n === 1 ? "" : "s"}. Move or delete them first.`,
      );
    }
    return (
      (
        await tx
          .delete(downloadCategories)
          .where(eq(downloadCategories.id, id))
          .returning({ id: downloadCategories.id })
      ).length > 0
    );
  },
};

export async function listCategories() {
  await requireAdmin();
  return getDb()
    .select({
      id: downloadCategories.id,
      name: downloadCategories.name,
      groupByProgramme: downloadCategories.groupByProgramme,
      sortOrder: downloadCategories.sortOrder,
      updatedAt: downloadCategories.updatedAt,
      downloads: count(downloads.id),
    })
    .from(downloadCategories)
    .leftJoin(downloads, eq(downloads.categoryId, downloadCategories.id))
    .groupBy(downloadCategories.id)
    .orderBy(asc(downloadCategories.sortOrder), asc(downloadCategories.name));
}

export async function getCategoryForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(downloadCategories)
    .where(eq(downloadCategories.id, id))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      description: asField(row.description),
      grouping: row.groupByProgramme ? "programme" : "heading",
      sortOrder: asField(row.sortOrder),
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- public

export type PublicDownload = {
  id: number;
  title: string;
  description: string | null;
  group: string | null;
  publishedOn: string | null;
  href: string;
  kind: "file" | "link";
  byteSize: number | null;
};

/** The published downloads by category, for the Downloads page; empty categories left out. */
export async function getPublishedDownloads() {
  "use cache";
  // programme names are shown as group headings, so a renamed programme refreshes this too
  cacheTag(DOWNLOADS_TAG, PROGRAMMES_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select({
      id: downloads.id,
      title: downloads.title,
      description: downloads.description,
      group: sql<string | null>`coalesce(${programmes.name}, ${downloads.groupLabel})`,
      publishedOn: downloads.publishedOn,
      kind: downloads.kind,
      externalUrl: downloads.externalUrl,
      storageKey: media.storageKey,
      byteSize: media.byteSize,
      categoryId: downloadCategories.id,
      category: downloadCategories.name,
      categoryDescription: downloadCategories.description,
    })
    .from(downloads)
    .innerJoin(downloadCategories, eq(downloadCategories.id, downloads.categoryId))
    .leftJoin(media, eq(media.id, downloads.fileId))
    .leftJoin(programmes, eq(programmes.id, downloads.programmeId))
    .where(eq(downloads.status, "published"))
    .orderBy(
      asc(downloadCategories.sortOrder),
      asc(downloadCategories.name),
      // within a category grouped by programme, the programmes in their display order
      sql`${programmes.sortOrder} asc nulls first`,
      asc(programmes.name),
      asc(downloads.sortOrder),
      asc(downloads.id),
    );

  const categories: {
    id: number;
    name: string;
    description: string | null;
    items: PublicDownload[];
  }[] = [];
  for (const row of rows) {
    const href =
      row.kind === "file" && row.storageKey
        ? `${mediaUrl(row.storageKey)}?download=1`
        : (row.externalUrl ?? null);
    if (!href) continue;
    let category = categories.at(-1);
    if (category?.id !== row.categoryId) {
      category = {
        id: row.categoryId,
        name: row.category,
        description: row.categoryDescription,
        items: [],
      };
      categories.push(category);
    }
    category.items.push({
      id: row.id,
      title: row.title,
      description: row.description,
      group: row.group,
      publishedOn: row.publishedOn,
      href,
      kind: row.kind,
      byteSize: row.kind === "file" ? row.byteSize : null,
    });
  }
  return categories;
}
