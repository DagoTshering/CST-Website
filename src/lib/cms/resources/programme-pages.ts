import "server-only";

import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { Programme } from "@/content/programmes";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalText, requiredLink, requiredText } from "../validation";
import { MONTH_NAMES, PROGRAMMES_TAG } from "./programmes";
import { asField } from "./shared";
import { STAFF_TAG } from "./staff";

/*
 * The programmes' pages (/programmes and /programmes/<slug>): each programme's modules and
 * facilities, the admission details every bachelor's page shows, and the published pages.
 * The programme's own page fields are on its record (see programmes.ts).
 */

const { admissionDetails, departments, media, programmeFacilities, programmeModules, programmes } =
  schema;

// ---------------------------------------------------------------------------- modules

const moduleSchema = z.object({
  name: requiredText("Name", 200),
  code: optionalText("Code", 40),
  description: optionalText("Description", 2000),
  // a ticked box sends "on"; unticked, nothing
  descriptionConfirmed: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

type ModuleInput = z.output<typeof moduleSchema>;

export const moduleFields: FieldDef[] = [
  { kind: "text", name: "name", label: "Name", required: true, maxLength: 200, width: "half" },
  {
    kind: "text",
    name: "code",
    label: "Code",
    maxLength: 40,
    width: "half",
    placeholder: "CTE101",
  },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    maxLength: 2000,
    rows: 3,
    help: "Shown when the module is opened on the page.",
  },
  {
    kind: "checkboxes",
    name: "descriptionConfirmed",
    label: "Description",
    options: [{ value: "on", label: "Confirmed by the department" }],
    help: "Leave unticked for a description written for the prototype that the department still has to check.",
  },
];

/** The modules of one programme (a fresh definition per programme, for its id). */
export function moduleResource(programmeId: number): ResourceDef<ModuleInput> {
  const ofProgramme = (id: number) =>
    and(eq(programmeModules.id, id), eq(programmeModules.programmeId, programmeId));
  return {
    singular: "module",
    basePath: `/admin/programmes/${programmeId}`,
    tag: PROGRAMMES_TAG,
    schema: moduleSchema,
    ordering: { key: "programmeModules", group: () => String(programmeId) },
    create: async (tx, data) =>
      (
        await tx
          .insert(programmeModules)
          .values({ ...data, programmeId })
          .returning({ id: programmeModules.id })
      )[0].id,
    update: async (tx, id, data) =>
      (
        await tx
          .update(programmeModules)
          .set(data)
          .where(ofProgramme(id))
          .returning({ id: programmeModules.id })
      ).length > 0,
    remove: async (tx, id) =>
      (
        await tx
          .delete(programmeModules)
          .where(ofProgramme(id))
          .returning({ id: programmeModules.id })
      ).length > 0,
  };
}

export async function getModuleForm(programmeId: number, id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(programmeModules)
    .where(and(eq(programmeModules.id, id), eq(programmeModules.programmeId, programmeId)))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      code: asField(row.code),
      description: asField(row.description),
      descriptionConfirmed: row.descriptionConfirmed ? "on" : "",
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- facilities

const facilitySchema = z.object({
  name: requiredText("Name", 160),
  description: optionalText("Description", 1000),
});

type FacilityInput = z.output<typeof facilitySchema>;

export const programmeFacilityFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    maxLength: 160,
    placeholder: "Surveying Laboratory",
  },
  { kind: "textarea", name: "description", label: "Description", maxLength: 1000, rows: 3 },
];

/** The facilities of one programme. */
export function programmeFacilityResource(programmeId: number): ResourceDef<FacilityInput> {
  const ofProgramme = (id: number) =>
    and(eq(programmeFacilities.id, id), eq(programmeFacilities.programmeId, programmeId));
  return {
    singular: "facility",
    basePath: `/admin/programmes/${programmeId}`,
    tag: PROGRAMMES_TAG,
    schema: facilitySchema,
    ordering: { key: "programmeFacilities", group: () => String(programmeId) },
    create: async (tx, data) =>
      (
        await tx
          .insert(programmeFacilities)
          .values({ ...data, programmeId })
          .returning({ id: programmeFacilities.id })
      )[0].id,
    update: async (tx, id, data) =>
      (
        await tx
          .update(programmeFacilities)
          .set(data)
          .where(ofProgramme(id))
          .returning({ id: programmeFacilities.id })
      ).length > 0,
    remove: async (tx, id) =>
      (
        await tx
          .delete(programmeFacilities)
          .where(ofProgramme(id))
          .returning({ id: programmeFacilities.id })
      ).length > 0,
  };
}

export async function getProgrammeFacilityForm(
  programmeId: number,
  id: number,
): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(programmeFacilities)
    .where(and(eq(programmeFacilities.id, id), eq(programmeFacilities.programmeId, programmeId)))
    .limit(1);
  return row
    ? { values: { name: row.name, description: asField(row.description) }, media: {} }
    : null;
}

/** A programme's name, for the pages of its modules and facilities; null if there is none. */
export async function getProgrammeName(programmeId: number) {
  await requireAdmin();
  const [row] = await getDb()
    .select({ name: programmes.name })
    .from(programmes)
    .where(eq(programmes.id, programmeId))
    .limit(1);
  return row?.name ?? null;
}

/** A programme's modules and facilities, in order, for its edit page. */
export async function listProgrammeParts(programmeId: number) {
  await requireAdmin();
  const db = getDb();
  const [modules, facilities] = await Promise.all([
    db
      .select()
      .from(programmeModules)
      .where(eq(programmeModules.programmeId, programmeId))
      .orderBy(asc(programmeModules.sortOrder), asc(programmeModules.name)),
    db
      .select()
      .from(programmeFacilities)
      .where(eq(programmeFacilities.programmeId, programmeId))
      .orderBy(asc(programmeFacilities.sortOrder), asc(programmeFacilities.name)),
  ]);
  return { modules, facilities };
}

// ---------------------------------------------------------------------------- admission details

const admissionSchema = z.object({
  requiredDocuments: requiredText("Documents required", 1000),
  admissionUrl: requiredLink("Admission page"),
});

type AdmissionInput = z.output<typeof admissionSchema>;

export const admissionFields: FieldDef[] = [
  {
    kind: "textarea",
    name: "requiredDocuments",
    label: "Documents required",
    required: true,
    maxLength: 1000,
    rows: 3,
    help: "Shown under the entry requirements of every bachelor's programme.",
  },
  {
    kind: "text",
    name: "admissionUrl",
    label: "Admission page",
    required: true,
    maxLength: 500,
    placeholder: "/admissions",
    help: "Linked beside the documents, for dates and how to apply: this site's Admissions page (/admissions) or another web address.",
  },
];

/** The admission details: one record, created the first time it is saved. */
export const admissionResource: ResourceDef<AdmissionInput> = {
  singular: "admission details",
  basePath: "/admin/programmes/admission",
  tag: PROGRAMMES_TAG,
  schema: admissionSchema,
  create: async (tx, data) => {
    await tx
      .insert(admissionDetails)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({ target: admissionDetails.id, set: data });
  },
  update: async () => false, // never used: saving always goes through create (an upsert)
  remove: async () => false,
};

export async function getAdmissionForm(): Promise<FormInitial> {
  await requireAdmin();
  const [row] = await getDb().select().from(admissionDetails).limit(1);
  return {
    values: {
      requiredDocuments: row?.requiredDocuments ?? "",
      admissionUrl: row?.admissionUrl ?? "",
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- public

export type Admission = { requiredDocuments: string; admissionUrl: string } | null;

const pageColumns = {
  id: programmes.id,
  slug: programmes.slug,
  name: programmes.name,
  shortName: programmes.shortName,
  level: programmes.level,
  degree: programmes.degree,
  duration: programmes.duration,
  startYear: programmes.startYear,
  startMonth: programmes.startMonth,
  summary: programmes.shortDescription,
  departmentCode: departments.code,
  departmentName: departments.name,
};

type PageRow = {
  slug: string | null;
  name: string;
  shortName: string | null;
  level: "undergraduate" | "postgraduate";
  degree: string | null;
  duration: string | null;
  startYear: number | null;
  startMonth: number | null;
  summary: string | null;
  departmentCode: string | null;
  departmentName: string | null;
};

/** The parts of a programme its listing and page share. */
function basics(row: PageRow) {
  return {
    slug: row.slug!,
    name: row.shortName ?? row.name,
    level: row.level === "postgraduate" ? ("master" as const) : ("bachelor" as const),
    degree: row.degree ?? "",
    duration: row.duration ?? "",
    // only with a month, as the original pages did ("Since July 2014")
    since:
      row.startMonth && row.startYear
        ? `${MONTH_NAMES[row.startMonth - 1]} ${row.startYear}`
        : null,
    departmentKey: row.departmentCode,
    departmentName: row.departmentName,
    summary: row.summary ?? "",
  };
}

const published = and(eq(programmes.status, "published"), isNotNull(programmes.slug));

/** The programmes with a published page, in display order, for the listing. */
export async function getPublishedProgrammeList() {
  "use cache";
  // department names are shown, so a renamed department refreshes this too
  cacheTag(PROGRAMMES_TAG, STAFF_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select(pageColumns)
    .from(programmes)
    .leftJoin(departments, eq(departments.id, programmes.departmentId))
    .where(published)
    .orderBy(asc(programmes.level), asc(programmes.sortOrder), asc(programmes.name));
  return rows.map((row) => basics(row));
}

/** A programme's published page, or null. */
export async function getPublishedProgramme(slug: string): Promise<Programme | null> {
  "use cache";
  cacheTag(PROGRAMMES_TAG, STAFF_TAG);
  cacheLife("hours");

  const db = getDb();
  const [row] = await db
    .select({
      ...pageColumns,
      websiteUrl: programmes.websiteUrl,
      documentUrl: programmes.documentUrl,
      documentFile: programmes.documentFileId,
      outcomes: programmes.outcomes,
      requirements: programmes.requirements,
      selectionNote: programmes.selectionNote,
      careers: programmes.careers,
      structureIntro: programmes.structureIntro,
      structureNote: programmes.structureNote,
      image1: programmes.imageId,
      image2: programmes.image2Id,
      image3: programmes.image3Id,
    })
    .from(programmes)
    .leftJoin(departments, eq(departments.id, programmes.departmentId))
    .where(and(published, eq(programmes.slug, slug)))
    .limit(1);
  if (!row) return null;

  const [modules, facilities] = await Promise.all([
    db
      .select()
      .from(programmeModules)
      .where(eq(programmeModules.programmeId, row.id))
      .orderBy(asc(programmeModules.sortOrder), asc(programmeModules.name)),
    db
      .select()
      .from(programmeFacilities)
      .where(eq(programmeFacilities.programmeId, row.id))
      .orderBy(asc(programmeFacilities.sortOrder), asc(programmeFacilities.name)),
  ]);
  const imageIds = [row.image1, row.image2, row.image3].filter((id): id is string => Boolean(id));
  const fileIds = row.documentFile ? [...imageIds, row.documentFile] : imageIds;
  const files = fileIds.length
    ? await db
        .select({ id: media.id, storageKey: media.storageKey })
        .from(media)
        .where(inArray(media.id, fileIds))
    : [];
  const fileUrl = new Map(files.map((p) => [p.id, mediaUrl(p.storageKey)]));

  return {
    ...basics(row),
    // only a department's website: a programme without a department links nowhere (the stored
    // link is kept, and shows again once a department is chosen)
    departmentUrl: row.departmentCode ? row.websiteUrl : null,
    documentUrl: row.documentUrl,
    documentFile: row.documentFile ? (fileUrl.get(row.documentFile) ?? null) : null,
    outcomes: row.outcomes,
    structure:
      modules.length > 0
        ? {
            kind: "modules",
            intro: row.structureIntro,
            note: row.structureNote,
            modules: modules.map((m) => ({
              name: m.name,
              description: m.description,
              descriptionSource: m.descriptionConfirmed ? "site" : "draft",
              code: m.code,
            })),
          }
        : { kind: "none" },
    requirements: row.requirements.length > 0 ? row.requirements : null,
    selectionNote: row.selectionNote,
    careers: row.careers.length > 0 ? row.careers : null,
    facilities:
      facilities.length > 0
        ? facilities.map((f) => ({ name: f.name, description: f.description ?? "" }))
        : null,
    images: imageIds.flatMap((id) => (fileUrl.has(id) ? [fileUrl.get(id)!] : [])),
  };
}

/** The admission details for the bachelor's pages, or null before they are set. */
export async function getAdmission(): Promise<Admission> {
  "use cache";
  cacheTag(PROGRAMMES_TAG);
  cacheLife("hours");

  const [row] = await getDb().select().from(admissionDetails).limit(1);
  return row ? { requiredDocuments: row.requiredDocuments, admissionUrl: row.admissionUrl } : null;
}
