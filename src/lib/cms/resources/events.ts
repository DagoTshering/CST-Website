import "server-only";

import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  optionalDate,
  optionalText,
  requiredDate,
  requiredMediaId,
  requiredText,
  status,
} from "../validation";
import { asField, loadPreview, mediaColumns, toPhoto, toPreview } from "./shared";

const { events, media } = schema;

export const EVENTS_TAG = "cms:events";

/** How many events the homepage carousel shows. */
const HOMEPAGE_LIMIT = 6;

const eventSchema = z
  .object({
    title: requiredText("Title", 200),
    description: optionalText("Description", 4000),
    startDate: requiredDate("Event date"),
    endDate: optionalDate("End date"),
    location: optionalText("Location", 200),
    imageId: requiredMediaId("Upload an image."),
    imageAlt: requiredText("Image description", 300),
    status,
  })
  // ISO dates compare correctly as strings.
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    path: ["endDate"],
    message: "The end date cannot be before the event date.",
  });

type EventInput = z.output<typeof eventSchema>;

export const eventFields: FieldDef[] = [
  { kind: "text", name: "title", label: "Title", required: true, maxLength: 200 },
  {
    kind: "date",
    name: "startDate",
    label: "Event date",
    required: true,
    width: "half",
  },
  {
    kind: "date",
    name: "endDate",
    label: "End date",
    width: "half",
    help: "Optional, for events over several days.",
  },
  { kind: "text", name: "location", label: "Location", maxLength: 200 },
  { kind: "textarea", name: "description", label: "Description", maxLength: 4000, rows: 6 },
  { kind: "image", name: "imageId", altName: "imageAlt", label: "Featured image", required: true },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const eventResource: ResourceDef<EventInput> = {
  singular: "event",
  basePath: "/admin/events",
  tag: EVENTS_TAG,
  schema: eventSchema,
  media: (data) => [{ field: "imageId", id: data.imageId, kind: "image" }],
  create: async (tx, data) => {
    await tx.insert(events).values(data);
  },
  update: async (tx, id, data) =>
    (await tx.update(events).set(data).where(eq(events.id, id)).returning({ id: events.id }))
      .length > 0,
  remove: async (tx, id) =>
    (await tx.delete(events).where(eq(events.id, id)).returning({ id: events.id })).length > 0,
};

export async function listEvents() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: events.id,
      title: events.title,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      status: events.status,
      updatedAt: events.updatedAt,
      image: mediaColumns,
    })
    .from(events)
    .leftJoin(media, eq(media.id, events.imageId))
    .orderBy(desc(events.startDate), desc(events.id));
  return rows.map((row) => ({ ...row, image: row.image ? toPreview(row.image) : null }));
}

export async function getEventForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(events).where(eq(events.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      title: row.title,
      description: asField(row.description),
      startDate: row.startDate,
      endDate: asField(row.endDate),
      location: asField(row.location),
      imageId: asField(row.imageId),
      imageAlt: asField(row.imageAlt),
      status: row.status,
    },
    media: { imageId: await loadPreview(row.imageId) },
  };
}

/** The latest published events for the homepage, newest first. */
export async function getPublishedEvents() {
  "use cache";
  cacheTag(EVENTS_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select({
      id: events.id,
      title: events.title,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      imageAlt: events.imageAlt,
      image: mediaColumns,
    })
    .from(events)
    .innerJoin(media, eq(media.id, events.imageId))
    .where(eq(events.status, "published"))
    .orderBy(desc(events.startDate), desc(events.id))
    .limit(HOMEPAGE_LIMIT);

  return rows.map(({ image, imageAlt, ...event }) => ({
    ...event,
    photo: toPhoto(image, imageAlt),
  }));
}
