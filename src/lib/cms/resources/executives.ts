import "server-only";

import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { roleTitle, type Executive } from "@/content/executives";
import type { Photo } from "@/content/home";
import { site } from "@/content/site";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { ResourceDef, Tx } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalMediaId, optionalText, requiredText, status } from "../validation";
import { asField, loadPreview, toPreview } from "./shared";
import { STAFF_TAG } from "./staff";

const { departments, executives, media, seedTombstones, staff } = schema;

/** Tag of the executives' cached data (the Executives page and the homepage's President). */
export const EXECUTIVES_TAG = "cms:executives";

/**
 * The chart's rows and how many people each can hold: one President at the head, three Deans in
 * the row below. To add someone to a full row, the person they replace is deleted first. Drafts
 * count too.
 */
export const CHART_ROWS = [
  { level: 1, role: "President", title: "President", limit: 1 },
  { level: 2, role: "Dean", title: "Deans", limit: 3 },
] as const;

/** What a Dean can be responsible for; each area has one Dean. Add an area here to offer it. */
export const DEAN_AREAS = [
  "Academic Affairs",
  "Research & Industrial Linkages",
  "Student Affairs",
] as const;

const rowOf = (level: number) => CHART_ROWS.find((row) => row.level === level)!;

/** How many executives each row has, by level. */
async function rowCounts(db: Pick<Tx, "select">, exceptId?: number | null) {
  const rows = await db
    .select({ level: executives.level, n: count() })
    .from(executives)
    .where(exceptId ? ne(executives.id, exceptId) : undefined)
    .groupBy(executives.level);
  return new Map(rows.map((row) => [row.level, row.n]));
}

/** The chart's rows with their counts, for the admin pages. */
export async function chartRows(exceptId?: number) {
  await requireAdmin();
  const counts = await rowCounts(getDb(), exceptId);
  return CHART_ROWS.map((row) => {
    const used = counts.get(row.level) ?? 0;
    return { ...row, used, full: used >= row.limit };
  });
}

/** The Dean areas without a Dean (leaving out the executive being edited). */
export async function freeDeanAreas(exceptId?: number) {
  await requireAdmin();
  const taken = await getDb()
    .select({ scope: executives.scope })
    .from(executives)
    .where(and(eq(executives.level, 2), exceptId ? ne(executives.id, exceptId) : undefined));
  const used = new Set(taken.map((t) => t.scope));
  return DEAN_AREAS.filter((area) => !used.has(area));
}

/** The executive's own photo, and their staff record's photo, used when they have none. */
const ownPhoto = alias(media, "own_photo");
const staffPhoto = alias(media, "staff_photo");

const photoColumns = (table: typeof ownPhoto | typeof staffPhoto) => ({
  id: table.id,
  storageKey: table.storageKey,
  originalName: table.originalName,
  kind: table.kind,
});

const executiveSchema = z
  .object({
    name: requiredText("Name", 160),
    // The role decides the row: a President heads the chart, a Dean is in the row below.
    level: z.enum(["1", "2"], { error: "Choose a role." }).transform(Number),
    scope: z
      .string()
      .optional()
      .transform((value) => DEAN_AREAS.find((area) => area === value) ?? null),
    staffId: z
      .string()
      .optional()
      .transform((value) => (value && /^\d{1,9}$/.test(value) ? Number(value) : null)),
    photoId: optionalMediaId,
    photoAlt: optionalText("Photo description", 300),
    biography: optionalText("Biography", 4000),
    status,
  })
  .refine((data) => !data.photoId || data.photoAlt, {
    path: ["photoAlt"],
    message: "Describe the photo for people who cannot see it.",
  })
  .refine((data) => data.level !== 2 || data.scope, {
    path: ["scope"],
    message: "Choose what the Dean is responsible for.",
  })
  // stored: the role's name, and an area only for a Dean
  .transform((data) => ({
    ...data,
    role: rowOf(data.level).role,
    scope: data.level === 2 ? data.scope : null,
  }));

type ExecutiveInput = z.output<typeof executiveSchema>;

type StaffOption = { id: number; name: string; department: string };

/** The form's fields; the staff list (for linking) comes from the database. */
/**
 * The form's fields; the staff list (for linking) comes from the database. `levels` are the roles
 * on offer (rows with room, and when editing their own); `areas` the Dean areas not yet taken
 * (and when editing their own).
 */
export function executiveFields(
  staffOptions: StaffOption[],
  levels: number[],
  areas: string[],
): FieldDef[] {
  return [
    { kind: "text", name: "name", label: "Name", required: true, maxLength: 160, width: "half" },
    {
      kind: "select",
      name: "level",
      label: "Role",
      required: true,
      width: "half",
      options: CHART_ROWS.filter((row) => levels.includes(row.level)).map((row) => ({
        value: String(row.level),
        label: row.role,
      })),
      help: "The President heads the chart and is featured on the homepage; Deans are in the row below. A role that is full is not offered: delete someone first.",
    },
    {
      kind: "select",
      name: "scope",
      label: "Responsible for",
      required: true,
      width: "half",
      options: areas.map((area) => ({ value: area, label: area })),
      help: "Shown as “Dean of …”. An area that already has a Dean is not offered.",
      showWhen: { field: "level", oneOf: ["2"] },
    },
    {
      kind: "select",
      name: "staffId",
      label: "Staff directory record",
      width: "half",
      options: [
        { value: "", label: "Not in the staff directory" },
        ...staffOptions.map((s) => ({ value: String(s.id), label: `${s.name} — ${s.department}` })),
      ],
      help: "Optional. When linked, the Staff Directory shows this role on their entry, and their directory photo is used if none is uploaded here.",
    },
    { kind: "image", name: "photoId", altName: "photoAlt", label: "Photo" },
    {
      kind: "textarea",
      name: "biography",
      label: "Biography or message",
      maxLength: 4000,
      rows: 5,
      help: "Optional. Shown on the homepage for the head of the chart.",
    },
    { kind: "status", name: "status", label: "Status", width: "half" },
  ];
}

export const executiveResource: ResourceDef<ExecutiveInput> = {
  singular: "executive",
  basePath: "/admin/executives",
  tag: EXECUTIVES_TAG,
  schema: executiveSchema,
  media: (data) => [{ field: "photoId", id: data.photoId, kind: "image" }],
  validate: async (tx, data, id): Promise<Record<string, string[]> | null> => {
    // One save at a time counts the rows, so two administrators cannot both fill the last place.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('executives:chart'))`);
    const chartRow = rowOf(data.level);
    const used = (await rowCounts(tx, id)).get(data.level) ?? 0;
    if (used >= chartRow.limit) {
      return {
        level: [
          chartRow.limit === 1
            ? `There can be only one ${chartRow.title}. Delete the current one first, then add the new one.`
            : `There can be at most ${chartRow.limit} ${chartRow.title}. Delete one first, then add the new one.`,
        ],
      };
    }
    if (data.scope) {
      const [holder] = await tx
        .select({ name: executives.name })
        .from(executives)
        .where(
          and(
            eq(executives.level, 2),
            eq(executives.scope, data.scope),
            id ? ne(executives.id, id) : undefined,
          ),
        )
        .limit(1);
      if (holder) {
        return {
          scope: [
            `${holder.name} is already Dean of ${data.scope}. Delete them first, or choose another area.`,
          ],
        };
      }
    }
    if (!data.staffId) return null;
    const [row] = await tx
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.id, data.staffId))
      .limit(1);
    return row ? null : { staffId: ["That staff record no longer exists. Choose another."] };
  },
  ordering: { key: "executives", group: (data) => String(data.level) },
  create: async (tx, data) =>
    (
      await tx
        .insert(executives)
        .values({ ...data, photoAlt: data.photoId ? data.photoAlt : null })
        .returning({ id: executives.id })
    )[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(executives)
        .set({ ...data, photoAlt: data.photoId ? data.photoAlt : null })
        .where(eq(executives.id, id))
        .returning({ id: executives.id })
    ).length > 0,
  // Someone seeded from the original data stays deleted: the seed will not add them again.
  remove: async (tx, id) => {
    const [row] = await tx
      .delete(executives)
      .where(eq(executives.id, id))
      .returning({ key: executives.legacyKey });
    if (!row) return false;
    if (row.key) {
      await tx
        .insert(seedTombstones)
        .values({ key: `executive:${row.key}` })
        .onConflictDoNothing();
    }
    return true;
  },
};

/** Every staff member, for linking an executive to their directory record. */
export async function listStaffOptions() {
  await requireAdmin();
  return getDb()
    .select({ id: staff.id, name: staff.name, department: departments.name })
    .from(staff)
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .orderBy(asc(staff.name));
}

export async function listExecutives() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: executives.id,
      name: executives.name,
      role: executives.role,
      scope: executives.scope,
      level: executives.level,
      sortOrder: executives.sortOrder,
      status: executives.status,
      updatedAt: executives.updatedAt,
      linked: staff.name,
      own: photoColumns(ownPhoto),
      fallback: photoColumns(staffPhoto),
    })
    .from(executives)
    .leftJoin(staff, eq(staff.id, executives.staffId))
    .leftJoin(ownPhoto, eq(ownPhoto.id, executives.photoId))
    .leftJoin(staffPhoto, eq(staffPhoto.id, staff.photoId))
    .orderBy(asc(executives.level), asc(executives.sortOrder), asc(executives.name));
  return rows.map(({ own, fallback, ...row }) => {
    // Drizzle returns null for a left-joined photo that is missing, whatever its types say.
    const photo = own?.storageKey ? own : fallback?.storageKey ? fallback : null;
    return {
      ...row,
      image: photo
        ? toPreview({
            id: photo.id!,
            storageKey: photo.storageKey!,
            originalName: photo.originalName!,
            kind: photo.kind!,
          })
        : null,
    };
  });
}

export async function getExecutiveForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(executives).where(eq(executives.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      role: row.role,
      scope: asField(row.scope),
      level: String(row.level),
      staffId: asField(row.staffId),
      photoId: asField(row.photoId),
      photoAlt: asField(row.photoAlt),
      biography: asField(row.biography),
      status: row.status,
    },
    media: { photoId: await loadPreview(row.photoId) },
  };
}

// ---------------------------------------------------------------------------- public

/** Published executives with their photo: their own, or else their staff record's. */
async function publishedExecutives() {
  const rows = await getDb()
    .select({
      id: executives.id,
      name: executives.name,
      role: executives.role,
      scope: executives.scope,
      level: executives.level,
      sortOrder: executives.sortOrder,
      photoAlt: executives.photoAlt,
      biography: executives.biography,
      ownKey: ownPhoto.storageKey,
      ownWidth: ownPhoto.width,
      ownHeight: ownPhoto.height,
      staffKey: staffPhoto.storageKey,
      staffWidth: staffPhoto.width,
      staffHeight: staffPhoto.height,
    })
    .from(executives)
    .leftJoin(staff, eq(staff.id, executives.staffId))
    .leftJoin(ownPhoto, eq(ownPhoto.id, executives.photoId))
    .leftJoin(staffPhoto, eq(staffPhoto.id, staff.photoId))
    .where(eq(executives.status, "published"))
    .orderBy(asc(executives.level), asc(executives.sortOrder), asc(executives.name));

  return rows.map((row) => {
    const own = row.ownKey !== null;
    const key = own ? row.ownKey : row.staffKey;
    return {
      ...row,
      photo: key
        ? {
            src: mediaUrl(key),
            width: (own ? row.ownWidth : row.staffWidth) ?? 800,
            height: (own ? row.ownHeight : row.staffHeight) ?? 1000,
          }
        : null,
    };
  });
}

/** The Executives page: the head of the chart and the row below it, left to right. */
export async function getPublishedExecutives(): Promise<{
  president: Executive | null;
  deans: Executive[];
}> {
  "use cache";
  // a linked staff record's photo is used, so a staff change refreshes this too
  cacheTag(EXECUTIVES_TAG, STAFF_TAG);
  cacheLife("hours");

  const people: Executive[] = (await publishedExecutives()).map((row) => {
    const person: Executive = {
      id: String(row.id),
      name: row.name,
      role: row.role,
      scope: row.scope ?? undefined,
      level: row.level === 1 ? 1 : 2,
      order: row.sortOrder,
      photo: row.photo?.src ?? null,
      alt: "",
    };
    person.alt = row.photoAlt ?? `Portrait of ${row.name}, ${roleTitle(person)}`;
    return person;
  });
  return {
    president: people.find((p) => p.level === 1) ?? null,
    // never more than the row holds (should there be more, only the first are shown)
    deans: people.filter((p) => p.level === 2).slice(0, rowOf(2).limit),
  };
}

/** The head of the chart, for the homepage's Leadership section; null without one (or a photo). */
export async function getFeaturedExecutive() {
  "use cache";
  cacheTag(EXECUTIVES_TAG, STAFF_TAG);
  cacheLife("hours");

  const head = (await publishedExecutives()).find((row) => row.level === 1);
  if (!head?.photo) return null;
  const title = roleTitle({
    role: head.role,
    scope: head.scope ?? undefined,
  } as Executive);
  const photo: Photo = {
    ...head.photo,
    alt: head.photoAlt ?? `Portrait of ${head.name}, ${title}`,
  };
  return {
    name: head.name,
    designation: `${title}, ${site.name}`,
    biography: head.biography,
    photo,
  };
}
