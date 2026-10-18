import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import { ActionError, type ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalMediaId, optionalText, optionalYear, requiredText, status } from "../validation";
import { asField, loadPreview, mediaColumns, toPreview } from "./shared";

const { downloads, programmes, media, staffProgrammes } = schema;

export const PROGRAMMES_TAG = "cms:programmes";

export const PROGRAMME_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
];

const programmeSchema = z
  .object({
    name: requiredText("Programme name", 200),
    level: z.enum(["undergraduate", "postgraduate"], { error: "Choose a level." }),
    shortDescription: optionalText("Short description", 600),
    startYear: optionalYear("Year first offered"),
    imageId: optionalMediaId,
    imageAlt: optionalText("Image description", 300),
    status,
  })
  .refine((data) => !data.imageId || data.imageAlt, {
    path: ["imageAlt"],
    message: "Describe the image for people who cannot see it.",
  })
  .transform((data) => ({ ...data, imageAlt: data.imageId ? data.imageAlt : null }));

type ProgrammeInput = z.output<typeof programmeSchema>;

export const programmeFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Programme name",
    required: true,
    maxLength: 200,
    placeholder: "Bachelor of Engineering in Civil Engineering",
  },
  {
    kind: "select",
    name: "level",
    label: "Level",
    required: true,
    options: PROGRAMME_LEVELS,
    width: "half",
  },
  {
    kind: "number",
    name: "startYear",
    label: "Year first offered",
    min: 1950,
    max: 2100,
    width: "half",
    help: "Optional. Shown beside the programme on the homepage.",
  },
  {
    kind: "textarea",
    name: "shortDescription",
    label: "Short description",
    maxLength: 600,
    rows: 3,
  },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Featured image" },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const programmeResource: ResourceDef<ProgrammeInput> = {
  singular: "programme",
  basePath: "/admin/programmes",
  tag: PROGRAMMES_TAG,
  schema: programmeSchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  ordering: { key: "programmes", group: () => "all" },
  create: async (tx, data) =>
    (await tx.insert(programmes).values(data).returning({ id: programmes.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(programmes)
        .set(data)
        .where(eq(programmes.id, id))
        .returning({ id: programmes.id })
    ).length > 0,
  remove: async (tx, id) => {
    // Downloads (the students' project reports) filed under the programme keep it in place.
    const [{ n }] = await tx
      .select({ n: count() })
      .from(downloads)
      .where(eq(downloads.programmeId, id));
    if (n > 0) {
      throw new ActionError(
        `${n} download${n === 1 ? " is" : "s are"} filed under this programme (Downloads › Students Project Reports). Move or delete ${n === 1 ? "it" : "them"} first.`,
      );
    }
    const [{ n: teaching }] = await tx
      .select({ n: count() })
      .from(staffProgrammes)
      .where(eq(staffProgrammes.programmeId, id));
    if (teaching > 0) {
      throw new ActionError(
        `${teaching} staff member${teaching === 1 ? " is" : "s are"} listed as teaching on this programme (Staff Directory). Remove it from ${teaching === 1 ? "their record" : "their records"} first.`,
      );
    }
    return (
      (await tx.delete(programmes).where(eq(programmes.id, id)).returning({ id: programmes.id }))
        .length > 0
    );
  },
};

export async function listProgrammes() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: programmes.id,
      name: programmes.name,
      level: programmes.level,
      startYear: programmes.startYear,
      sortOrder: programmes.sortOrder,
      status: programmes.status,
      updatedAt: programmes.updatedAt,
      image: mediaColumns,
    })
    .from(programmes)
    .leftJoin(media, eq(media.id, programmes.imageId))
    .orderBy(asc(programmes.level), asc(programmes.sortOrder), asc(programmes.name));
  return rows.map((row) => ({ ...row, image: row.image ? toPreview(row.image) : null }));
}

export async function getProgrammeForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(programmes).where(eq(programmes.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      level: row.level,
      shortDescription: asField(row.shortDescription),
      startYear: asField(row.startYear),
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      status: row.status,
    },
    media: { imageId: await loadPreview(row.imageId) },
  };
}

/** Published programmes for the homepage, in display order. */
export async function getPublishedProgrammes() {
  "use cache";
  cacheTag(PROGRAMMES_TAG);
  cacheLife("hours");

  return getDb()
    .select({
      id: programmes.id,
      name: programmes.name,
      level: programmes.level,
      startYear: programmes.startYear,
    })
    .from(programmes)
    .where(eq(programmes.status, "published"))
    .orderBy(asc(programmes.sortOrder), asc(programmes.name));
}
