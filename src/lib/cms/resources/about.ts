import "server-only";

import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalText, requiredMediaId, requiredText, status } from "../validation";
import { asField, loadPreview, mediaColumns, toPhoto } from "./shared";

const { aboutSection, media } = schema;

export const ABOUT_TAG = "cms:about";

/** The section is one row; its id is fixed. */
const ABOUT_ID = 1;

const aboutSchema = z
  .object({
    heading: requiredText("Title", 200),
    emphasis: optionalText("Emphasised words", 80),
    subtitle: optionalText("Short description", 200),
    body: requiredText("Main content", 6000),
    imageId: requiredMediaId("Upload an image."),
    imageAlt: requiredText("Image description", 300),
    caption: optionalText("Caption", 200),
    status,
  })
  .refine((data) => !data.emphasis || data.heading.includes(data.emphasis), {
    path: ["emphasis"],
    message: "The emphasised words must appear exactly as written in the title.",
  });

type AboutInput = z.output<typeof aboutSchema>;

export const aboutFields: FieldDef[] = [
  {
    kind: "text",
    name: "heading",
    label: "Title",
    required: true,
    maxLength: 200,
    placeholder: "Bhutan’s premier institute for engineering education",
  },
  {
    kind: "text",
    name: "emphasis",
    label: "Emphasised words",
    maxLength: 80,
    width: "half",
    help: "Optional. Part of the title shown in colour with a gold underline.",
  },
  {
    kind: "text",
    name: "subtitle",
    label: "Short description",
    maxLength: 200,
    width: "half",
    placeholder: "Royal University of Bhutan · Rinchending",
  },
  {
    kind: "textarea",
    name: "body",
    label: "Main content",
    required: true,
    maxLength: 6000,
    rows: 10,
    help: "Separate paragraphs with a blank line. The first paragraph is set larger.",
  },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Featured image", required: true },
  { kind: "text", name: "caption", label: "Image caption", maxLength: 200 },
  { kind: "status", name: "status", label: "Visibility", width: "half" },
];

/** About CST is a single section: saving creates it the first time and updates it after that. */
export const aboutResource: ResourceDef<AboutInput> = {
  singular: "About CST section",
  basePath: "/admin/about",
  tag: ABOUT_TAG,
  schema: aboutSchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  create: async (tx, data) => {
    await tx
      .insert(aboutSection)
      .values({ id: ABOUT_ID, ...data })
      .onConflictDoUpdate({ target: aboutSection.id, set: data });
  },
  update: async () => false, // never used: saving always goes through create (an upsert)
  remove: async (tx) =>
    (await tx.delete(aboutSection).returning({ id: aboutSection.id })).length > 0,
};

export async function getAboutForm(): Promise<(FormInitial & { updatedAt: Date }) | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(aboutSection)
    .where(eq(aboutSection.id, ABOUT_ID))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      heading: row.heading,
      emphasis: asField(row.emphasis),
      subtitle: asField(row.subtitle),
      body: row.body,
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      caption: asField(row.caption),
      status: row.status,
    },
    media: { imageId: await loadPreview(row.imageId) },
    updatedAt: row.updatedAt,
  };
}

/** The published About CST section for the homepage, or null. */
export async function getPublishedAbout() {
  "use cache";
  cacheTag(ABOUT_TAG);
  cacheLife("hours");

  const [row] = await getDb()
    .select({
      heading: aboutSection.heading,
      emphasis: aboutSection.emphasis,
      subtitle: aboutSection.subtitle,
      body: aboutSection.body,
      imageAlt: aboutSection.imageAlt,
      caption: aboutSection.caption,
      image: mediaColumns,
    })
    .from(aboutSection)
    .innerJoin(media, eq(media.id, aboutSection.imageId))
    .where(and(eq(aboutSection.id, ABOUT_ID), eq(aboutSection.status, "published")))
    .limit(1);

  if (!row) return null;
  return {
    heading: row.heading,
    emphasis: row.emphasis,
    subtitle: row.subtitle,
    paragraphs: row.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    caption: row.caption,
    photo: toPhoto(row.image, row.imageAlt),
  };
}
