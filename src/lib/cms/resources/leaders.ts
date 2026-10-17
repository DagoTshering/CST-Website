import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalText, requiredMediaId, requiredText, sortOrder, status } from "../validation";
import { asField, loadPreview, mediaColumns, toPhoto, toPreview } from "./shared";

const { leaders, media } = schema;

export const LEADERS_TAG = "cms:leaders";

const leaderSchema = z.object({
  name: requiredText("Name", 160),
  designation: requiredText("Designation", 200),
  biography: optionalText("Biography", 4000),
  portraitId: requiredMediaId("Upload a portrait."),
  portraitAlt: requiredText("Portrait description", 300),
  sortOrder,
  status,
});

type LeaderInput = z.output<typeof leaderSchema>;

export const leaderFields: FieldDef[] = [
  { kind: "text", name: "name", label: "Name", required: true, maxLength: 160, width: "half" },
  {
    kind: "text",
    name: "designation",
    label: "Official designation",
    required: true,
    maxLength: 200,
    width: "half",
    placeholder: "President, College of Science and Technology",
  },
  { kind: "textarea", name: "biography", label: "Biography", maxLength: 4000, rows: 6 },
  { kind: "image", name: "portraitId", altName: "portraitAlt", label: "Portrait", required: true },
  {
    kind: "number",
    name: "sortOrder",
    label: "Display order",
    min: 0,
    max: 9999,
    width: "half",
    help: "The published profile with the lowest number is featured on the homepage.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const leaderResource: ResourceDef<LeaderInput> = {
  singular: "leadership profile",
  basePath: "/admin/leadership",
  tag: LEADERS_TAG,
  schema: leaderSchema,
  media: (data) => [{ field: "portraitId", id: data.portraitId, kind: "image" }],
  create: async (tx, data) => {
    await tx.insert(leaders).values(data);
  },
  update: async (tx, id, data) =>
    (await tx.update(leaders).set(data).where(eq(leaders.id, id)).returning({ id: leaders.id }))
      .length > 0,
  remove: async (tx, id) =>
    (await tx.delete(leaders).where(eq(leaders.id, id)).returning({ id: leaders.id })).length > 0,
};

export async function listLeaders() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: leaders.id,
      name: leaders.name,
      designation: leaders.designation,
      sortOrder: leaders.sortOrder,
      status: leaders.status,
      updatedAt: leaders.updatedAt,
      image: mediaColumns,
    })
    .from(leaders)
    .leftJoin(media, eq(media.id, leaders.portraitId))
    .orderBy(asc(leaders.sortOrder), asc(leaders.name));
  return rows.map((row) => ({ ...row, image: row.image ? toPreview(row.image) : null }));
}

export async function getLeaderForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(leaders).where(eq(leaders.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      designation: row.designation,
      biography: asField(row.biography),
      portraitId: asField(row.portraitId),
      portraitAlt: asField(row.portraitAlt),
      sortOrder: asField(row.sortOrder),
      status: row.status,
    },
    media: { portraitId: await loadPreview(row.portraitId) },
  };
}

/** The leadership profile featured on the homepage: the first published one. */
export async function getFeaturedLeader() {
  "use cache";
  cacheTag(LEADERS_TAG);
  cacheLife("hours");

  const [row] = await getDb()
    .select({
      name: leaders.name,
      designation: leaders.designation,
      biography: leaders.biography,
      portraitAlt: leaders.portraitAlt,
      portrait: mediaColumns,
    })
    .from(leaders)
    .innerJoin(media, eq(media.id, leaders.portraitId))
    .where(eq(leaders.status, "published"))
    .orderBy(asc(leaders.sortOrder), asc(leaders.name))
    .limit(1);

  if (!row) return null;
  return {
    name: row.name,
    designation: row.designation,
    biography: row.biography,
    photo: toPhoto(row.portrait, row.portraitAlt),
  };
}
