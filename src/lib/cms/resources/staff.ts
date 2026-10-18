import "server-only";

import { and, asc, count, eq, ilike, inArray, isNotNull, or, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { Department, StaffMember } from "@/content/staff";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import { ActionError, type ResourceDef, type Tx } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  checkedIds,
  checkedValues,
  optionalMediaId,
  optionalText,
  requiredText,
  status,
} from "../validation";
import { PROGRAMMES_TAG } from "./programmes";
import { asField, loadPreview, mediaColumns, toPreview } from "./shared";

const {
  departments,
  designations,
  executives,
  media,
  programmes,
  seedTombstones,
  staff,
  staffProgrammes,
} = schema;

/** Tag of the staff directory's cached data; departments and staff both feed it. */
export const STAFF_TAG = "cms:staff";

/**
 * The department duties a staff member can hold, shown as roles in the directory. Executive
 * roles (a Dean, the President) are not among them: they come from the executive linked to the
 * staff record (Admin › Executives), so they leave the directory when that executive does.
 */
export const DUTIES = [
  { value: "HoD", label: "Head of Department" },
  { value: "PL", label: "Programme Leader" },
] as const;

const DUTY_CODES = DUTIES.map((d) => d.value);
const dutyLabel = new Map<string, string>(DUTIES.map((d) => [d.value, d.label]));

/** "Bachelor of Engineering in Civil Engineering" -> "Civil Engineering", for the directory. */
export const shortProgrammeName = (name: string) =>
  name
    .replace(/^(Bachelor|Master) of (Engineering in )?/, "")
    .replace(/^Master by Research in /, "");

// ---------------------------------------------------------------------------- departments

const departmentSchema = z.object({
  code: requiredText("Code", 12).pipe(
    z
      .string()
      .regex(/^[A-Za-z0-9]{2,12}$/, "Use 2–12 letters or digits, e.g. CEED.")
      .transform((code) => code.toUpperCase()),
  ),
  name: requiredText("Name", 120),
  kind: z.enum(["department", "administration"], { error: "Choose a type." }),
});

type DepartmentInput = z.output<typeof departmentSchema>;

export const departmentFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    maxLength: 120,
    placeholder: "Civil & Environmental Engineering",
  },
  {
    kind: "text",
    name: "code",
    label: "Code",
    required: true,
    maxLength: 12,
    width: "half",
    placeholder: "CEED",
    help: "A short, unique code.",
  },
  {
    kind: "select",
    name: "kind",
    label: "Type",
    required: true,
    width: "half",
    options: [
      { value: "department", label: "Academic department" },
      { value: "administration", label: "Administrative unit" },
    ],
  },
];

async function codeTaken(tx: Tx, code: string, exceptId?: number) {
  const [row] = await tx
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.code, code))
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export const departmentResource: ResourceDef<DepartmentInput> = {
  singular: "department",
  basePath: "/admin/staff/departments",
  tag: STAFF_TAG,
  schema: departmentSchema,
  ordering: { key: "departments", group: () => "all" },
  create: async (tx, data) => {
    if (await codeTaken(tx, data.code)) {
      throw new ActionError("A department with that code exists.");
    }
    const [row] = await tx.insert(departments).values(data).returning({ id: departments.id });
    return row.id;
  },
  update: async (tx, id, data) => {
    if (await codeTaken(tx, data.code, id)) {
      throw new ActionError("A department with that code exists.");
    }
    return (
      (
        await tx
          .update(departments)
          .set(data)
          .where(eq(departments.id, id))
          .returning({ id: departments.id })
      ).length > 0
    );
  },
  remove: async (tx, id) => {
    const [{ n }] = await tx.select({ n: count() }).from(staff).where(eq(staff.departmentId, id));
    if (n > 0) {
      throw new ActionError(
        `This department still has ${n} staff member${n === 1 ? "" : "s"}. Move or delete them first.`,
      );
    }
    return (
      (await tx.delete(departments).where(eq(departments.id, id)).returning({ id: departments.id }))
        .length > 0
    );
  },
};

export async function listDepartments() {
  await requireAdmin();
  return getDb()
    .select({
      id: departments.id,
      code: departments.code,
      name: departments.name,
      kind: departments.kind,
      sortOrder: departments.sortOrder,
      updatedAt: departments.updatedAt,
      staff: count(staff.id),
    })
    .from(departments)
    .leftJoin(staff, eq(staff.departmentId, departments.id))
    .groupBy(departments.id)
    .orderBy(asc(departments.sortOrder), asc(departments.name));
}

export async function getDepartmentForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(departments).where(eq(departments.id, id)).limit(1);
  if (!row) return null;
  return {
    values: { code: row.code, name: row.name, kind: row.kind },
    media: {},
  };
}

// ---------------------------------------------------------------------------- designations

const designationSchema = z.object({ name: requiredText("Name", 120) });

type DesignationInput = z.output<typeof designationSchema>;

export const designationFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    maxLength: 120,
    placeholder: "Assistant Professor",
    help: "A position staff can hold, offered in the staff form’s Designation list.",
  },
];

async function designationTaken(tx: Tx, name: string, exceptId?: number) {
  const [row] = await tx
    .select({ id: designations.id })
    .from(designations)
    .where(eq(designations.name, name))
    .limit(1);
  return Boolean(row && row.id !== exceptId);
}

export const designationResource: ResourceDef<DesignationInput> = {
  singular: "designation",
  basePath: "/admin/staff/designations",
  tag: STAFF_TAG,
  schema: designationSchema,
  create: async (tx, data) => {
    if (await designationTaken(tx, data.name)) {
      throw new ActionError("That designation already exists.");
    }
    const [row] = await tx.insert(designations).values(data).returning({ id: designations.id });
    return row.id;
  },
  update: async (tx, id, data) => {
    if (await designationTaken(tx, data.name, id)) {
      throw new ActionError("That designation already exists.");
    }
    return (
      (
        await tx
          .update(designations)
          .set(data)
          .where(eq(designations.id, id))
          .returning({ id: designations.id })
      ).length > 0
    );
  },
  remove: async (tx, id) => {
    const [{ n }] = await tx.select({ n: count() }).from(staff).where(eq(staff.designationId, id));
    if (n > 0) {
      throw new ActionError(
        `${n} staff member${n === 1 ? " holds" : "s hold"} this designation. Give ${n === 1 ? "them" : "them"} another first.`,
      );
    }
    return (
      (
        await tx
          .delete(designations)
          .where(eq(designations.id, id))
          .returning({ id: designations.id })
      ).length > 0
    );
  },
};

/** The designations in alphabetical order, with how many staff hold each. */
export async function listDesignations() {
  await requireAdmin();
  return getDb()
    .select({
      id: designations.id,
      name: designations.name,
      updatedAt: designations.updatedAt,
      staff: count(staff.id),
    })
    .from(designations)
    .leftJoin(staff, eq(staff.designationId, designations.id))
    .groupBy(designations.id)
    .orderBy(asc(designations.name));
}

export async function listDesignationOptions() {
  await requireAdmin();
  return getDb()
    .select({ id: designations.id, name: designations.name })
    .from(designations)
    .orderBy(asc(designations.name));
}

export async function getDesignationForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(designations).where(eq(designations.id, id)).limit(1);
  return row ? { values: { name: row.name }, media: {} } : null;
}

// ---------------------------------------------------------------------------- staff

const staffSchema = z.object({
  name: requiredText("Name", 160),
  designationId: z
    .string({ error: "Choose a designation." })
    .regex(/^\d{1,9}$/, "Choose a designation.")
    .transform(Number),
  duties: checkedValues(DUTY_CODES),
  departmentId: z
    .string({ error: "Choose a department." })
    .regex(/^\d{1,9}$/, "Choose a department.")
    .transform(Number),
  programmeIds: checkedIds,
  email: optionalText("Email", 320).pipe(
    z.union([z.null(), z.email("Enter a valid email address.")]),
  ),
  photoId: optionalMediaId,
  status,
});

type StaffInput = z.output<typeof staffSchema>;

type Option = { id: number; name: string };

/** The form's fields; departments and programmes come from the database. */
export function staffFields(
  departmentOptions: Option[],
  programmeOptions: Option[],
  designationOptions: Option[],
): FieldDef[] {
  return [
    { kind: "text", name: "name", label: "Name", required: true, maxLength: 160, width: "half" },
    {
      kind: "select",
      name: "departmentId",
      label: "Department",
      required: true,
      width: "half",
      options: departmentOptions.map((d) => ({ value: String(d.id), label: d.name })),
    },
    {
      kind: "select",
      name: "designationId",
      label: "Designation",
      required: true,
      width: "half",
      options: designationOptions.map((d) => ({ value: String(d.id), label: d.name })),
      help: "Their position. Missing one? Add it under Staff Directory › Designations.",
    },
    {
      kind: "text",
      name: "email",
      label: "Email",
      maxLength: 320,
      placeholder: "name.cst@rub.edu.bt",
    },
    {
      kind: "checkboxes",
      name: "duties",
      label: "Duties",
      columns: 2,
      options: DUTIES.map((d) => ({ value: d.value, label: `${d.label} (${d.value})` })),
      help: "Shown as roles under their designation.",
    },
    {
      kind: "checkboxes",
      name: "programmeIds",
      label: "Programmes",
      columns: 2,
      options: programmeOptions.map((p) => ({ value: String(p.id), label: p.name })),
      help: "The programmes a lecturer teaches on. Leave empty for support staff.",
    },
    {
      kind: "image",
      name: "photoId",
      label: "Photo",
      help: "A portrait, JPEG, PNG or WebP. Without one, the person's initials are shown.",
    },
    { kind: "status", name: "status", label: "Status", width: "half" },
  ];
}

async function linkProgrammes(tx: Tx, staffId: number, programmeIds: number[]) {
  await tx.delete(staffProgrammes).where(eq(staffProgrammes.staffId, staffId));
  if (programmeIds.length > 0) {
    await tx
      .insert(staffProgrammes)
      .values(programmeIds.map((programmeId) => ({ staffId, programmeId })));
  }
}

export const staffResource: ResourceDef<StaffInput> = {
  singular: "staff member",
  basePath: "/admin/staff",
  tag: STAFF_TAG,
  schema: staffSchema,
  ordering: { key: "staff", group: (data) => String(data.departmentId) },
  media: (data) => [{ field: "photoId", id: data.photoId, kind: "image" }],
  validate: async (tx, data): Promise<Record<string, string[]> | null> => {
    const [department] = await tx
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, data.departmentId))
      .limit(1);
    if (!department) return { departmentId: ["That department no longer exists. Choose another."] };
    const [designation] = await tx
      .select({ id: designations.id })
      .from(designations)
      .where(eq(designations.id, data.designationId))
      .limit(1);
    if (!designation) {
      return { designationId: ["That designation no longer exists. Choose another."] };
    }
    if (data.programmeIds.length > 0) {
      const [{ n }] = await tx
        .select({ n: count() })
        .from(programmes)
        .where(inArray(programmes.id, data.programmeIds));
      if (n !== data.programmeIds.length) {
        return { programmeIds: ["A programme no longer exists. Reload the page and try again."] };
      }
    }
    return null;
  },
  create: async (tx, { programmeIds, ...data }) => {
    const [row] = await tx.insert(staff).values(data).returning({ id: staff.id });
    await linkProgrammes(tx, row.id, programmeIds);
    return row.id;
  },
  update: async (tx, id, { programmeIds, ...data }) => {
    const updated = await tx
      .update(staff)
      .set(data)
      .where(eq(staff.id, id))
      .returning({ id: staff.id });
    if (updated.length === 0) return false;
    await linkProgrammes(tx, id, programmeIds);
    return true;
  },
  // Programme links go with the record; an executive linked to it is kept, unlinked. Someone
  // seeded from the original export stays deleted: the seed will not add them again.
  remove: async (tx, id) => {
    const [row] = await tx
      .delete(staff)
      .where(eq(staff.id, id))
      .returning({ key: staff.legacyKey });
    if (!row) return false;
    if (row.key) {
      await tx
        .insert(seedTombstones)
        .values({ key: `staff:${row.key}` })
        .onConflictDoNothing();
    }
    return true;
  },
};

export async function listDepartmentOptions() {
  await requireAdmin();
  return getDb()
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .orderBy(asc(departments.sortOrder), asc(departments.name));
}

export async function listProgrammeChoices() {
  await requireAdmin();
  return getDb()
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes)
    .orderBy(asc(programmes.sortOrder), asc(programmes.name));
}

/** Staff for the admin list, optionally in one department or matching a search. */
export async function listStaff(filter: { departmentId?: number; query?: string } = {}) {
  await requireAdmin();
  const conditions: SQL[] = [];
  if (filter.departmentId) conditions.push(eq(staff.departmentId, filter.departmentId));
  const words = (filter.query ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
  for (const word of words) {
    const like = `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(ilike(staff.name, like), ilike(designations.name, like), ilike(staff.email, like))!,
    );
  }
  const rows = await getDb()
    .select({
      id: staff.id,
      name: staff.name,
      designation: designations.name,
      status: staff.status,
      updatedAt: staff.updatedAt,
      department: departments.name,
      photo: mediaColumns,
    })
    .from(staff)
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .innerJoin(designations, eq(designations.id, staff.designationId))
    .leftJoin(media, eq(media.id, staff.photoId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(departments.sortOrder), asc(staff.sortOrder), asc(staff.name));
  return rows.map(({ photo, ...row }) => ({ ...row, image: photo ? toPreview(photo) : null }));
}

export async function countStaff() {
  await requireAdmin();
  const [{ n }] = await getDb().select({ n: count() }).from(staff);
  return n;
}

export async function getStaffForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  if (!row) return null;
  const linked = await db
    .select({ id: staffProgrammes.programmeId })
    .from(staffProgrammes)
    .where(eq(staffProgrammes.staffId, id));
  return {
    values: {
      name: row.name,
      designationId: asField(row.designationId),
      duties: row.duties.join(","),
      departmentId: String(row.departmentId),
      programmeIds: linked.map((l) => l.id).join(","),
      email: asField(row.email),
      photoId: asField(row.photoId),
      status: row.status,
    },
    media: { photoId: await loadPreview(row.photoId) },
  };
}

// ---------------------------------------------------------------------------- public

/**
 * The published staff directory, in the shape its components take: departments with published
 * staff (in display order), and the people, each with their roles and programmes.
 */
export async function getPublishedStaffDirectory(): Promise<{
  departments: Department[];
  staff: StaffMember[];
}> {
  "use cache";
  // programme names are shown in the directory, so a renamed programme refreshes this too
  // a linked executive's role is shown too, so a change of executives refreshes this as well
  cacheTag(STAFF_TAG, PROGRAMMES_TAG, "cms:executives");
  cacheLife("hours");

  const db = getDb();
  const rows = await db
    .select({
      id: staff.id,
      name: staff.name,
      designation: designations.name,
      duties: staff.duties,
      email: staff.email,
      photoKey: media.storageKey,
      departmentId: departments.id,
      departmentCode: departments.code,
      departmentName: departments.name,
      departmentKind: departments.kind,
    })
    .from(staff)
    .innerJoin(departments, eq(departments.id, staff.departmentId))
    .innerJoin(designations, eq(designations.id, staff.designationId))
    .leftJoin(media, eq(media.id, staff.photoId))
    .where(eq(staff.status, "published"))
    .orderBy(
      asc(departments.sortOrder),
      asc(departments.name),
      asc(staff.sortOrder),
      asc(staff.name),
    );

  const taught = await db
    .select({ staffId: staffProgrammes.staffId, name: programmes.name })
    .from(staffProgrammes)
    .innerJoin(programmes, eq(programmes.id, staffProgrammes.programmeId))
    .orderBy(asc(programmes.sortOrder), asc(programmes.name));
  const programmesOf = new Map<number, string[]>();
  for (const t of taught) {
    programmesOf.set(t.staffId, [
      ...(programmesOf.get(t.staffId) ?? []),
      shortProgrammeName(t.name),
    ]);
  }

  // "Dean of Academic Affairs": the role of each published executive linked to a staff record
  const linked = await db
    .select({ staffId: executives.staffId, role: executives.role, scope: executives.scope })
    .from(executives)
    .where(and(eq(executives.status, "published"), isNotNull(executives.staffId)))
    .orderBy(asc(executives.level), asc(executives.sortOrder));
  const executiveRoles = new Map<number, string[]>();
  for (const e of linked) {
    const title = e.scope ? `${e.role} of ${e.scope}` : e.role;
    executiveRoles.set(e.staffId!, [...(executiveRoles.get(e.staffId!) ?? []), title]);
  }

  const seen = new Map<number, Department>();
  for (const row of rows) {
    if (!seen.has(row.departmentId)) {
      seen.set(row.departmentId, {
        key: row.departmentCode,
        label: row.departmentName,
        group: row.departmentKind === "administration" ? "Administration" : "Department",
      });
    }
  }

  return {
    departments: [...seen.values()],
    staff: rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      // the position, shown under their name (the old site's combined designation is not kept)
      designation: row.designation,
      rank: row.designation,
      tags: row.duties,
      roles: [
        ...(executiveRoles.get(row.id) ?? []),
        ...row.duties.flatMap((code) => (dutyLabel.has(code) ? [dutyLabel.get(code)!] : [])),
      ],
      programmes: programmesOf.get(row.id) ?? [],
      department: row.departmentCode,
      departmentLabel: row.departmentName,
      email: row.email,
      image: row.photoKey ? mediaUrl(row.photoKey) : null,
    })),
  };
}
