import "server-only";

import { and, asc, count, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  lines,
  optionalMediaId,
  optionalText,
  optionalUrl,
  requiredText,
  status,
} from "../validation";
import { PROGRAMMES_TAG } from "./programmes";
import { asField, loadPreview, mediaColumns, toPreview } from "./shared";

/*
 * The About page (/about): its text (one record), the college's names over the years and its
 * research and innovation centres. The programme counts it shows come from Academic Programmes.
 * (The homepage's About CST section is managed separately: about.ts.)
 */

const { aboutPage, collegeNames, media, programmes, researchCentres } = schema;

export const ABOUT_PAGE_TAG = "cms:about-page";

/** The page's text is one row; its id is fixed. */
const PAGE_ID = 1;

export const CENTRE_GROUPS = [
  { value: "research", label: "Research centre" },
  { value: "innovation", label: "Innovation and entrepreneurship" },
] as const;

export type CentreGroup = (typeof CENTRE_GROUPS)[number]["value"];

// ---------------------------------------------------------------------------- the page's text

const pageSchema = z
  .object({
    introHeading: requiredText("Heading", 200),
    introEmphasis: optionalText("Emphasised words", 80),
    introText: requiredText("About the college", 4000),
    introImageId: optionalMediaId,
    introImageAlt: optionalText("Image description", 300),
    namesHeading: requiredText("Heading", 200),
    namesEmphasis: optionalText("Emphasised words", 80),
    namesText: optionalText("Introduction", 1000),
    vision: requiredText("Vision", 300),
    visionEmphasis: optionalText("Emphasised words", 80),
    visionText: optionalText("About the vision", 2000),
    pillars: lines("Pursued through", 3, 200),
    offerHeading: requiredText("Heading", 200),
    offerEmphasis: optionalText("Emphasised words", 80),
    offerText: optionalText("Introduction", 2000),
    plannedProgramme: optionalText("Planned programme", 120),
    services: lines("Services", 12, 120),
    centresHeading: requiredText("Heading", 200),
    centresEmphasis: optionalText("Emphasised words", 80),
    centresText: optionalText("Introduction", 2000),
  })
  .superRefine((data, ctx) => {
    // each emphasis must be part of its heading, as it is shown in place
    const pairs = [
      ["introEmphasis", data.introHeading, data.introEmphasis],
      ["namesEmphasis", data.namesHeading, data.namesEmphasis],
      ["visionEmphasis", data.vision, data.visionEmphasis],
      ["offerEmphasis", data.offerHeading, data.offerEmphasis],
      ["centresEmphasis", data.centresHeading, data.centresEmphasis],
    ] as const;
    for (const [field, heading, emphasis] of pairs) {
      if (emphasis && !heading.includes(emphasis)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "The emphasised words must appear exactly as written above.",
        });
      }
    }
    if (data.introImageId && !data.introImageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["introImageAlt"],
        message: "Describe the image for people who cannot see it.",
      });
    }
  })
  .transform((data) => ({
    ...data,
    introImageAlt: data.introImageId ? data.introImageAlt : null,
  }));

type PageInput = z.output<typeof pageSchema>;

const emphasisField = (name: string): FieldDef => ({
  kind: "text",
  name,
  label: "Emphasised words",
  maxLength: 80,
  width: "half",
  help: "Optional. Part of the heading shown in colour with a gold underline.",
});

const oneLine = "One per line.";

export const pageFields: FieldDef[] = [
  { kind: "heading", name: "introSection", label: "The college" },
  {
    kind: "text",
    name: "introHeading",
    label: "Heading",
    required: true,
    maxLength: 200,
    width: "half",
  },
  emphasisField("introEmphasis"),
  {
    kind: "textarea",
    name: "introText",
    label: "About the college",
    required: true,
    maxLength: 4000,
    rows: 5,
    help: "The page's opening paragraph, beside the campus photo.",
  },
  { kind: "image", name: "introImageId", altName: "introImageAlt", label: "Campus photo" },

  {
    kind: "heading",
    name: "namesSection",
    label: "Names through the years",
    help: "The names themselves are listed below this form.",
  },
  {
    kind: "text",
    name: "namesHeading",
    label: "Heading",
    required: true,
    maxLength: 200,
    width: "half",
  },
  emphasisField("namesEmphasis"),
  { kind: "textarea", name: "namesText", label: "Introduction", maxLength: 1000, rows: 2 },

  { kind: "heading", name: "visionSection", label: "Vision" },
  { kind: "text", name: "vision", label: "Vision", required: true, maxLength: 300, width: "half" },
  emphasisField("visionEmphasis"),
  { kind: "textarea", name: "visionText", label: "About the vision", maxLength: 2000, rows: 3 },
  {
    kind: "textarea",
    name: "pillars",
    label: "Pursued through",
    maxLength: 700,
    rows: 3,
    help: `Up to three, each shown with an icon. ${oneLine}`,
  },

  {
    kind: "heading",
    name: "offerSection",
    label: "What we offer",
    help: "The numbers of undergraduate and postgraduate programmes are counted from Academic Programmes.",
  },
  {
    kind: "text",
    name: "offerHeading",
    label: "Heading",
    required: true,
    maxLength: 200,
    width: "half",
  },
  emphasisField("offerEmphasis"),
  { kind: "textarea", name: "offerText", label: "Introduction", maxLength: 2000, rows: 3 },
  {
    kind: "text",
    name: "plannedProgramme",
    label: "Planned programme",
    maxLength: 120,
    width: "half",
    placeholder: "PhD in Engineering",
    help: "Optional. Shown beside the counts as planned.",
  },
  {
    kind: "textarea",
    name: "services",
    label: "Services",
    maxLength: 1600,
    rows: 3,
    help: oneLine,
  },

  {
    kind: "heading",
    name: "centresSection",
    label: "Research and innovation",
    help: "The centres themselves are listed below this form.",
  },
  {
    kind: "text",
    name: "centresHeading",
    label: "Heading",
    required: true,
    maxLength: 200,
    width: "half",
  },
  emphasisField("centresEmphasis"),
  { kind: "textarea", name: "centresText", label: "Introduction", maxLength: 2000, rows: 3 },
];

/** The page's text is a single record: saving creates it the first time and updates it after. */
export const pageResource: ResourceDef<PageInput> = {
  singular: "About page",
  basePath: "/admin/about-page",
  tag: ABOUT_PAGE_TAG,
  schema: pageSchema,
  media: (data) => [{ field: "introImageId", id: data.introImageId, kind: "image" }],
  create: async (tx, data) => {
    await tx
      .insert(aboutPage)
      .values({ id: PAGE_ID, ...data })
      .onConflictDoUpdate({ target: aboutPage.id, set: data });
  },
  update: async () => false, // never used: saving always goes through create (an upsert)
  remove: async () => false,
};

export async function getPageForm(): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(aboutPage).where(eq(aboutPage.id, PAGE_ID)).limit(1);
  if (!row) return null;
  return {
    values: {
      introHeading: row.introHeading,
      introEmphasis: asField(row.introEmphasis),
      introText: row.introText,
      introImageId: asField(row.introImageId),
      introImageAlt: asField(row.introImageAlt),
      namesHeading: row.namesHeading,
      namesEmphasis: asField(row.namesEmphasis),
      namesText: asField(row.namesText),
      vision: row.vision,
      visionEmphasis: asField(row.visionEmphasis),
      visionText: asField(row.visionText),
      pillars: row.pillars.join("\n"),
      offerHeading: row.offerHeading,
      offerEmphasis: asField(row.offerEmphasis),
      offerText: asField(row.offerText),
      plannedProgramme: asField(row.plannedProgramme),
      services: row.services.join("\n"),
      centresHeading: row.centresHeading,
      centresEmphasis: asField(row.centresEmphasis),
      centresText: asField(row.centresText),
    },
    media: { introImageId: await loadPreview(row.introImageId) },
  };
}

// ---------------------------------------------------------------------------- the college's names

const nameSchema = z
  .object({
    year: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter the year, e.g. 1974.")
      .transform(Number)
      .pipe(z.number().min(1900, "Enter a year from 1900.").max(2100, "Enter a year up to 2100.")),
    name: requiredText("Name", 200),
    note: optionalText("Note", 120),
    imageId: optionalMediaId,
    imageAlt: optionalText("Image description", 300),
  })
  .refine((data) => !data.imageId || data.imageAlt, {
    path: ["imageAlt"],
    message: "Describe the image for people who cannot see it.",
  })
  .transform((data) => ({ ...data, imageAlt: data.imageId ? data.imageAlt : null }));

type NameInput = z.output<typeof nameSchema>;

export const nameFields: FieldDef[] = [
  {
    kind: "text",
    name: "year",
    label: "Year",
    required: true,
    maxLength: 4,
    width: "half",
    placeholder: "1974",
    help: "The timeline is in order of year.",
  },
  {
    kind: "text",
    name: "note",
    label: "Note",
    maxLength: 120,
    width: "half",
    placeholder: "Established",
  },
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    maxLength: 200,
    placeholder: "Royal Bhutan Polytechnic",
  },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Photo" },
];

export const nameResource: ResourceDef<NameInput> = {
  singular: "name",
  basePath: "/admin/about-page",
  tag: ABOUT_PAGE_TAG,
  schema: nameSchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  create: async (tx, data) =>
    (await tx.insert(collegeNames).values(data).returning({ id: collegeNames.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(collegeNames)
        .set(data)
        .where(eq(collegeNames.id, id))
        .returning({ id: collegeNames.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(collegeNames)
        .where(eq(collegeNames.id, id))
        .returning({ id: collegeNames.id })
    ).length > 0,
};

export async function getNameForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(collegeNames).where(eq(collegeNames.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      year: String(row.year),
      name: row.name,
      note: asField(row.note),
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
    },
    media: { imageId: await loadPreview(row.imageId) },
  };
}

// ---------------------------------------------------------------------------- the centres

const centreSchema = z
  .object({
    group: z.enum(["research", "innovation"], { error: "Choose the kind of centre." }),
    acronym: requiredText("Name on the page", 80),
    fullName: optionalText("Full name", 200),
    description: optionalText("Description", 3000),
    websiteUrl: optionalUrl("Website"),
    email: optionalText("Email", 254).pipe(
      z.union([z.null(), z.email("Enter a valid email address.")]),
    ),
    imageId: optionalMediaId,
    imageAlt: optionalText("Image description", 300),
    status,
  })
  .refine((data) => !data.imageId || data.imageAlt, {
    path: ["imageAlt"],
    message: "Describe the image for people who cannot see it.",
  })
  .transform((data) => ({ ...data, imageAlt: data.imageId ? data.imageAlt : null }));

type CentreInput = z.output<typeof centreSchema>;

export const centreFields: FieldDef[] = [
  {
    kind: "select",
    name: "group",
    label: "Kind",
    required: true,
    width: "half",
    options: CENTRE_GROUPS.map((g) => ({ value: g.value, label: g.label })),
  },
  {
    kind: "text",
    name: "acronym",
    label: "Name on the page",
    required: true,
    maxLength: 80,
    width: "half",
    placeholder: "CRSED",
    help: "Usually its short name or acronym.",
  },
  {
    kind: "text",
    name: "fullName",
    label: "Full name",
    maxLength: 200,
    placeholder: "Centre for Renewable and Sustainable Energy Development",
  },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    maxLength: 3000,
    rows: 4,
    help: "What it does. Without one, the page says that details are to be added.",
  },
  {
    kind: "text",
    name: "websiteUrl",
    label: "Website",
    maxLength: 500,
    width: "half",
    placeholder: "https://…",
  },
  { kind: "text", name: "email", label: "Email", maxLength: 254, width: "half" },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Photo" },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const centreResource: ResourceDef<CentreInput> = {
  singular: "centre",
  basePath: "/admin/about-page",
  tag: ABOUT_PAGE_TAG,
  schema: centreSchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  ordering: { key: "centres", group: (data) => data.group },
  create: async (tx, data) =>
    (await tx.insert(researchCentres).values(data).returning({ id: researchCentres.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(researchCentres)
        .set(data)
        .where(eq(researchCentres.id, id))
        .returning({ id: researchCentres.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(researchCentres)
        .where(eq(researchCentres.id, id))
        .returning({ id: researchCentres.id })
    ).length > 0,
};

export async function getCentreForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(researchCentres)
    .where(eq(researchCentres.id, id))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      group: row.group,
      acronym: row.acronym,
      fullName: asField(row.fullName),
      description: asField(row.description),
      websiteUrl: asField(row.websiteUrl),
      email: asField(row.email),
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      status: row.status,
    },
    media: { imageId: await loadPreview(row.imageId) },
  };
}

/** The names and centres for the admin page, each with its thumbnail. */
export async function listAboutParts() {
  await requireAdmin();
  const db = getDb();
  const [names, centres] = await Promise.all([
    db
      .select({
        id: collegeNames.id,
        year: collegeNames.year,
        name: collegeNames.name,
        note: collegeNames.note,
        updatedAt: collegeNames.updatedAt,
        image: mediaColumns,
      })
      .from(collegeNames)
      .leftJoin(media, eq(media.id, collegeNames.imageId))
      .orderBy(asc(collegeNames.year), asc(collegeNames.id)),
    db
      .select({
        id: researchCentres.id,
        group: researchCentres.group,
        acronym: researchCentres.acronym,
        fullName: researchCentres.fullName,
        status: researchCentres.status,
        updatedAt: researchCentres.updatedAt,
        image: mediaColumns,
      })
      .from(researchCentres)
      .leftJoin(media, eq(media.id, researchCentres.imageId))
      .orderBy(asc(researchCentres.group), asc(researchCentres.sortOrder), asc(researchCentres.id)),
  ]);
  const withThumb = <R extends { image: Parameters<typeof toPreview>[0] | null }>(row: R) => ({
    ...row,
    image: row.image ? toPreview(row.image) : null,
  });
  return { names: names.map(withThumb), centres: centres.map(withThumb) };
}

// ---------------------------------------------------------------------------- public

export type PagePhoto = { src: string; alt: string } | null;

/**
 * Everything the About page shows, or null before its text has been written. Names and centres
 * without a photo show a placeholder frame.
 */
export async function getPublishedAboutPage() {
  "use cache";
  // the programme counts come from Academic Programmes
  cacheTag(ABOUT_PAGE_TAG, PROGRAMMES_TAG);
  cacheLife("hours");

  const db = getDb();
  const [page] = await db.select().from(aboutPage).where(eq(aboutPage.id, PAGE_ID)).limit(1);
  if (!page) return null;

  const [names, centres, counts] = await Promise.all([
    db.select().from(collegeNames).orderBy(asc(collegeNames.year), asc(collegeNames.id)),
    db
      .select()
      .from(researchCentres)
      .where(eq(researchCentres.status, "published"))
      .orderBy(asc(researchCentres.sortOrder), asc(researchCentres.id)),
    // as the Programmes page lists them: published, with a page of their own
    db
      .select({ level: programmes.level, n: count() })
      .from(programmes)
      .where(and(eq(programmes.status, "published"), isNotNull(programmes.slug)))
      .groupBy(programmes.level),
  ]);

  const imageIds = [
    page.introImageId,
    ...names.map((n) => n.imageId),
    ...centres.map((c) => c.imageId),
  ];
  const ids = imageIds.filter((id): id is string => Boolean(id));
  const files = ids.length
    ? await db
        .select({ id: media.id, storageKey: media.storageKey })
        .from(media)
        .where(inArray(media.id, ids))
    : [];
  const urls = new Map(files.map((f) => [f.id, mediaUrl(f.storageKey)]));
  const photo = (id: string | null, alt: string | null): PagePhoto =>
    id && urls.has(id) ? { src: urls.get(id)!, alt: alt ?? "" } : null;
  const programmeCount = (level: "undergraduate" | "postgraduate") =>
    counts.find((c) => c.level === level)?.n ?? 0;

  return {
    intro: {
      heading: page.introHeading,
      emphasis: page.introEmphasis,
      text: page.introText,
      photo: photo(page.introImageId, page.introImageAlt),
    },
    names: {
      heading: page.namesHeading,
      emphasis: page.namesEmphasis,
      text: page.namesText,
      items: names.map((n) => ({
        id: n.id,
        year: String(n.year),
        name: n.name,
        note: n.note,
        photo: photo(n.imageId, n.imageAlt),
      })),
    },
    vision: {
      statement: page.vision,
      emphasis: page.visionEmphasis,
      text: page.visionText,
      pillars: page.pillars,
    },
    offer: {
      heading: page.offerHeading,
      emphasis: page.offerEmphasis,
      text: page.offerText,
      undergraduate: programmeCount("undergraduate"),
      postgraduate: programmeCount("postgraduate"),
      planned: page.plannedProgramme,
      services: page.services,
    },
    centres: {
      heading: page.centresHeading,
      emphasis: page.centresEmphasis,
      text: page.centresText,
      items: centres.map((c) => ({
        id: c.id,
        group: c.group,
        acronym: c.acronym,
        fullName: c.fullName,
        description: c.description,
        websiteUrl: c.websiteUrl,
        email: c.email,
        photo: photo(c.imageId, c.imageAlt),
      })),
    },
  };
}

export type AboutPageContent = NonNullable<Awaited<ReturnType<typeof getPublishedAboutPage>>>;
