import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { requiredMediaId, requiredText, sortOrder, status } from "../validation";
import { asField, loadPreview, mediaColumns, toPhoto, toPreview } from "./shared";

const { facilities, media } = schema;

export const FACILITIES_TAG = "cms:facilities";

const facilitySchema = z.object({
  name: requiredText("Name", 120),
  description: requiredText("Description", 600),
  imageId: requiredMediaId("Upload an image."),
  imageAlt: requiredText("Image description", 300),
  sortOrder,
  status,
});

type FacilityInput = z.output<typeof facilitySchema>;

export const facilityFields: FieldDef[] = [
  { kind: "text", name: "name", label: "Name", required: true, maxLength: 120 },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    required: true,
    maxLength: 600,
    rows: 4,
    help: "One or two sentences, shown under the photograph.",
  },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Image", required: true },
  {
    kind: "number",
    name: "sortOrder",
    label: "Display order",
    min: 0,
    max: 9999,
    width: "half",
    help: "Lower numbers appear first.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const facilityResource: ResourceDef<FacilityInput> = {
  singular: "facility",
  basePath: "/admin/facilities",
  tag: FACILITIES_TAG,
  schema: facilitySchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  create: async (tx, data) => {
    await tx.insert(facilities).values(data);
  },
  update: async (tx, id, data) =>
    (
      await tx
        .update(facilities)
        .set(data)
        .where(eq(facilities.id, id))
        .returning({ id: facilities.id })
    ).length > 0,
  remove: async (tx, id) =>
    (await tx.delete(facilities).where(eq(facilities.id, id)).returning({ id: facilities.id }))
      .length > 0,
};

export async function listFacilities() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: facilities.id,
      name: facilities.name,
      sortOrder: facilities.sortOrder,
      status: facilities.status,
      updatedAt: facilities.updatedAt,
      image: mediaColumns,
    })
    .from(facilities)
    .leftJoin(media, eq(media.id, facilities.imageId))
    .orderBy(asc(facilities.sortOrder), asc(facilities.name));
  return rows.map((row) => ({ ...row, image: row.image ? toPreview(row.image) : null }));
}

export async function getFacilityForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(facilities).where(eq(facilities.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      description: row.description,
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      sortOrder: asField(row.sortOrder),
      status: row.status,
    },
    media: { imageId: await loadPreview(row.imageId) },
  };
}

/** Published facilities for the homepage, in display order. */
export async function getPublishedFacilities() {
  "use cache";
  cacheTag(FACILITIES_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select({
      id: facilities.id,
      name: facilities.name,
      description: facilities.description,
      imageAlt: facilities.imageAlt,
      image: mediaColumns,
    })
    .from(facilities)
    .innerJoin(media, eq(media.id, facilities.imageId))
    .where(eq(facilities.status, "published"))
    .orderBy(asc(facilities.sortOrder), asc(facilities.name));

  return rows.map((row) => ({
    id: row.id,
    title: row.name,
    text: row.description,
    photo: toPhoto(row.image, row.imageAlt),
  }));
}
