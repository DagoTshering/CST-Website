import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import { ActionError, type ResourceDef, type Tx } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  lines,
  optionalMediaId,
  optionalText,
  optionalUrl,
  optionalYear,
  requiredText,
  status,
} from "../validation";
import { asField, loadPreview, mediaColumns, toPreview } from "./shared";

const { departments, downloads, programmes, media, staffProgrammes } = schema;

export const PROGRAMMES_TAG = "cms:programmes";

export const PROGRAMME_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Civil Engineering" -> "civil-engineering" */
const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const programmeSchema = z
  .object({
    name: requiredText("Full title", 200),
    shortName: optionalText("Name on its page", 120),
    slug: optionalText("Web address", 80).pipe(
      z
        .string()
        .regex(
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          "Use lower-case letters, digits and hyphens, e.g. civil-engineering.",
        )
        .nullable(),
    ),
    level: z.enum(["undergraduate", "postgraduate"], { error: "Choose a level." }),
    degree: optionalText("Degree", 160),
    duration: optionalText("Duration", 40),
    startYear: optionalYear("Year first offered"),
    startMonth: z
      .string()
      .optional()
      .transform((value) => (value && /^(?:[1-9]|1[0-2])$/.test(value) ? Number(value) : null)),
    departmentId: z
      .string()
      .optional()
      .transform((value) => (value && /^\d{1,9}$/.test(value) ? Number(value) : null)),
    shortDescription: optionalText("Summary", 1000),
    outcomes: lines("Learning outcomes"),
    structureIntro: optionalText("Structure introduction", 2000),
    structureNote: optionalText("Structure note", 1000),
    requirements: lines("Entry requirements"),
    selectionNote: optionalText("Selection", 1000),
    careers: lines("Careers"),
    websiteUrl: optionalUrl("Department web page"),
    documentUrl: optionalUrl("Programme document link"),
    documentFileId: optionalMediaId,
    imageId: optionalMediaId,
    imageAlt: optionalText("Image description", 300),
    image2Id: optionalMediaId,
    image3Id: optionalMediaId,
    status,
  })
  .refine((data) => !data.imageId || data.imageAlt, {
    path: ["imageAlt"],
    message: "Describe the image for people who cannot see it.",
  })
  .transform((data) => ({
    ...data,
    imageAlt: data.imageId ? data.imageAlt : null,
    // a programme with a name for its page gets a web address from it, unless one is given
    slug: data.slug ?? (data.shortName ? slugify(data.shortName) || null : null),
  }));

type ProgrammeInput = z.output<typeof programmeSchema>;

const oneLine = "One per line.";

/** The form's fields; the departments come from the Staff Directory. */
export function programmeFields(departmentOptions: { id: number; name: string }[]): FieldDef[] {
  return [
    { kind: "heading", name: "basicsHeading", label: "Basics" },
    {
      kind: "text",
      name: "name",
      label: "Full title",
      required: true,
      maxLength: 200,
      placeholder: "Bachelor of Engineering in Civil Engineering",
      help: "As on the homepage and in the Staff Directory.",
    },
    {
      kind: "text",
      name: "shortName",
      label: "Name on its page",
      maxLength: 120,
      width: "half",
      placeholder: "Civil Engineering",
      help: "The programme's page needs it: without it, the programme has no page.",
    },
    {
      kind: "text",
      name: "slug",
      label: "Web address",
      maxLength: 80,
      width: "half",
      placeholder: "civil-engineering",
      help: "The page is /programmes/<this>. Left empty, it is made from the name.",
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
      kind: "select",
      name: "departmentId",
      label: "Department",
      width: "half",
      options: [
        { value: "", label: "None (a college-level programme)" },
        ...departmentOptions.map((d) => ({ value: String(d.id), label: d.name })),
      ],
    },
    {
      kind: "text",
      name: "degree",
      label: "Degree",
      maxLength: 160,
      width: "half",
      placeholder: "Bachelor of Engineering",
    },
    {
      kind: "text",
      name: "duration",
      label: "Duration",
      maxLength: 40,
      width: "half",
      placeholder: "4 years",
    },
    {
      kind: "number",
      name: "startYear",
      label: "Year first offered",
      min: 1950,
      max: 2100,
      width: "half",
      help: "Shown beside the programme on the homepage.",
    },
    {
      kind: "select",
      name: "startMonth",
      label: "Month first offered",
      width: "half",
      options: [
        { value: "", label: "Not shown" },
        ...MONTH_NAMES.map((month, i) => ({ value: String(i + 1), label: month })),
      ],
      help: "With the year, the page says “Since July 2014”.",
    },

    { kind: "heading", name: "pageHeading", label: "The programme's page" },
    {
      kind: "textarea",
      name: "shortDescription",
      label: "Summary",
      maxLength: 1000,
      rows: 3,
      help: "At the top of its page and in the list of programmes.",
    },
    {
      kind: "textarea",
      name: "outcomes",
      label: "Learning outcomes",
      maxLength: 15000,
      rows: 5,
      help: oneLine,
    },
    {
      kind: "textarea",
      name: "structureIntro",
      label: "Programme structure: introduction",
      maxLength: 2000,
      rows: 3,
      help: "Above the modules (add the modules below, after saving).",
    },
    {
      kind: "textarea",
      name: "structureNote",
      label: "Programme structure: note",
      maxLength: 1000,
      rows: 2,
      help: "Optional. Below the modules.",
    },
    {
      kind: "textarea",
      name: "requirements",
      label: "Entry requirements",
      maxLength: 15000,
      rows: 5,
      help: `${oneLine} Left empty, the page says they are not published yet.`,
    },
    {
      kind: "textarea",
      name: "selectionNote",
      label: "Selection",
      maxLength: 1000,
      rows: 2,
      help: "Optional. How applicants are selected.",
    },
    {
      kind: "textarea",
      name: "careers",
      label: "Careers",
      maxLength: 15000,
      rows: 4,
      help: oneLine,
    },
    {
      kind: "text",
      name: "websiteUrl",
      label: "Department web page",
      maxLength: 500,
      placeholder: "https://ceed.cst.edu.bt/…",
      help: "The department’s page about this programme, for the “Departmental website” button. Not shown without a department.",
    },
    {
      kind: "text",
      name: "documentUrl",
      label: "Programme document link",
      maxLength: 500,
      placeholder: "https://drive.google.com/…",
      help: "Optional. The full curriculum, e.g. on Google Drive.",
    },
    {
      kind: "document",
      name: "documentFileId",
      label: "Programme document (PDF)",
      help: "Optional. PDF, up to 100 MB. With a link as well, the page offers both.",
    },

    {
      kind: "heading",
      name: "photosHeading",
      label: "Photos",
      help: "Up to three, for the collage at the top of its page.",
    },
    { kind: "image", name: "imageId", altName: "imageAlt", label: "First photo" },
    { kind: "image", name: "image2Id", label: "Second photo" },
    { kind: "image", name: "image3Id", label: "Third photo" },
    { kind: "status", name: "status", label: "Status", width: "half" },
  ];
}

async function slugTaken(tx: Tx, slug: string, exceptId: number | null) {
  const [row] = await tx
    .select({ id: programmes.id })
    .from(programmes)
    .where(eq(programmes.slug, slug))
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export const programmeResource: ResourceDef<ProgrammeInput> = {
  singular: "programme",
  basePath: "/admin/programmes",
  tag: PROGRAMMES_TAG,
  schema: programmeSchema,
  media: (data) => [
    { field: "imageId", id: data.imageId, kind: "image" },
    { field: "image2Id", id: data.image2Id, kind: "image" },
    { field: "image3Id", id: data.image3Id, kind: "image" },
    { field: "documentFileId", id: data.documentFileId, kind: "document" },
  ],
  validate: async (tx, data, id): Promise<Record<string, string[]> | null> => {
    if (data.slug && (await slugTaken(tx, data.slug, id))) {
      return { slug: ["Another programme has this web address. Choose another."] };
    }
    if (data.departmentId) {
      const [row] = await tx
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.id, data.departmentId))
        .limit(1);
      if (!row) return { departmentId: ["That department no longer exists. Choose another."] };
    }
    return null;
  },
  ordering: { key: "programmes", group: (data) => data.level },
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
      slug: programmes.slug,
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
      shortName: asField(row.shortName),
      slug: asField(row.slug),
      level: row.level,
      degree: asField(row.degree),
      duration: asField(row.duration),
      startYear: asField(row.startYear),
      startMonth: asField(row.startMonth),
      departmentId: asField(row.departmentId),
      shortDescription: asField(row.shortDescription),
      outcomes: row.outcomes.join("\n"),
      structureIntro: asField(row.structureIntro),
      structureNote: asField(row.structureNote),
      requirements: row.requirements.join("\n"),
      selectionNote: asField(row.selectionNote),
      careers: row.careers.join("\n"),
      websiteUrl: asField(row.websiteUrl),
      documentUrl: asField(row.documentUrl),
      documentFileId: asField(row.documentFileId),
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      image2Id: asField(row.image2Id),
      image3Id: asField(row.image3Id),
      status: row.status,
    },
    media: {
      imageId: await loadPreview(row.imageId),
      image2Id: await loadPreview(row.image2Id),
      image3Id: await loadPreview(row.image3Id),
      documentFileId: await loadPreview(row.documentFileId),
    },
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
      slug: programmes.slug,
    })
    .from(programmes)
    .where(eq(programmes.status, "published"))
    .orderBy(asc(programmes.level), asc(programmes.sortOrder), asc(programmes.name));
}
