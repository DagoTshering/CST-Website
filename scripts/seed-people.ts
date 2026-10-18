/**
 * Seeds the staff directory and the executives from data/people/staff.json and
 * data/people/executives.json (the static data the pages were first built from).
 *
 * - Departments are created, in the export's order, while there are none.
 * - Each person is added once, published, keyed by their id in the export (legacy_key). Someone
 *   an administrator has edited is left alone, and someone they deleted is not added again (their
 *   key is in seed_tombstones).
 * - Photos are copied from public/images into the upload store. A lecturer's programmes are
 *   linked by name to the Academic Programmes ("Civil" -> Bachelor of Engineering in Civil
 *   Engineering). An executive who is also in the directory is linked to their staff record.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { count, eq, inArray } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";
import { imageCopier } from "./seed-images";

type Db = ReturnType<typeof getDb>;

type SeedDepartment = { key: string; label: string; group: "Department" | "Administration" };
type SeedStaff = {
  id: string;
  name: string;
  designation: string;
  rank: string;
  tags: string[];
  programmes: string[];
  department: string;
  email: string | null;
  image: string | null;
};
type SeedExecutive = {
  id: string;
  name: string;
  role: string;
  scope?: string;
  level: 1 | 2;
  order: number;
  photo: string | null;
  alt: string;
};

const DATA_DIR = path.join(process.cwd(), "data/people");

/** Must match the keys written by the delete actions (src/lib/cms/resources/staff.ts). */
export const staffTombstone = (key: string) => `staff:${key}`;
export const executiveTombstone = (key: string) => `executive:${key}`;

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^(dr|mr|mrs|ms)\.?\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

export async function seedPeople(db: Db, schema: typeof Schema) {
  const {
    departments,
    designations,
    executives,
    programmes,
    seedTombstones,
    staff,
    staffProgrammes,
  } = schema;
  const read = async <T>(file: string) =>
    JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8")) as T;
  const { departments: seedDepartments, staff: seedStaff } = await read<{
    departments: SeedDepartment[];
    staff: SeedStaff[];
  }>("staff.json");
  const { executives: seedExecutives } = await read<{ executives: SeedExecutive[] }>(
    "executives.json",
  );

  // ------------------------------------------------------------------ departments
  const [{ n: departmentCount }] = await db.select({ n: count() }).from(departments);
  if (departmentCount === 0) {
    await db.insert(departments).values(
      seedDepartments.map((d, i) => ({
        code: d.key,
        name: d.label,
        kind: d.group === "Administration" ? ("administration" as const) : ("department" as const),
        sortOrder: (i + 1) * 10,
      })),
    );
    console.log(`Departments: seeded ${seedDepartments.length}.`);
  } else {
    console.log("Departments: already exist; left unchanged.");
  }
  const departmentIds = new Map(
    (await db.select({ id: departments.id, code: departments.code }).from(departments)).map((d) => [
      d.code,
      d.id,
    ]),
  );

  // "Civil" -> "Bachelor of Engineering in Civil Engineering"
  const programmeRows = await db
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes);
  const programmeFor = (label: string) => {
    const x = normalise(label);
    return (
      programmeRows.find((p) => {
        const name = normalise(p.name);
        return name.endsWith(` ${x}`) || name.endsWith(` ${x} engineering`);
      })?.id ?? null
    );
  };

  const tombstones = new Set(
    (await db.select({ key: seedTombstones.key }).from(seedTombstones)).map((t) => t.key),
  );

  // ------------------------------------------------------------------ designations
  // Each position in the data (its rank, or else its designation up to "/" or " (") is a
  // designation; any not in the list yet is added.
  const positionOf = (person: SeedStaff) =>
    (person.rank || person.designation.replace(/\s*[/(].*$/, "")).trim();
  const positions = [...new Set(seedStaff.map(positionOf))];
  await db
    .insert(designations)
    .values(positions.map((name) => ({ name })))
    .onConflictDoNothing({ target: designations.name });
  const designationIds = new Map(
    (await db.select({ id: designations.id, name: designations.name }).from(designations)).map(
      (d) => [d.name, d.id],
    ),
  );

  // ------------------------------------------------------------------ staff
  const presentStaff = new Set(
    (
      await db
        .select({ key: staff.legacyKey })
        .from(staff)
        .where(
          inArray(
            staff.legacyKey,
            seedStaff.map((p) => p.id),
          ),
        )
    ).map((r) => r.key),
  );
  const tally = { added: 0, present: 0, deleted: 0, skipped: 0 };
  const unmatched = new Set<string>();
  const position = new Map<string, number>();

  for (const person of seedStaff) {
    const order = (position.get(person.department) ?? 0) + 10;
    position.set(person.department, order);
    if (presentStaff.has(person.id)) {
      tally.present++;
      continue;
    }
    if (tombstones.has(staffTombstone(person.id))) {
      tally.deleted++;
      continue;
    }
    const departmentId = departmentIds.get(person.department);
    if (!departmentId) {
      tally.skipped++;
      console.log(`  skipped ${person.name}: department ${person.department} no longer exists`);
      continue;
    }
    const programmeIds = [
      ...new Set(
        person.programmes.flatMap((label) => {
          const id = programmeFor(label);
          if (!id) unmatched.add(label);
          return id ? [id] : [];
        }),
      ),
    ];

    const images = imageCopier(schema);
    try {
      await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(staff)
          .values({
            name: person.name,
            designationId: designationIds.get(positionOf(person))!,
            // a Dean's title comes from the executives, not the staff record (migration 0006)
            duties: person.tags.filter((tag) => tag === "HoD" || tag === "PL"),
            departmentId,
            email: person.email,
            photoId: person.image ? await images.copy(tx, person.image) : null,
            sortOrder: order,
            status: "published",
            legacyKey: person.id,
          })
          .returning({ id: staff.id });
        if (programmeIds.length > 0) {
          await tx
            .insert(staffProgrammes)
            .values(programmeIds.map((programmeId) => ({ staffId: row.id, programmeId })));
        }
      });
      tally.added++;
    } catch (error) {
      await images.discard();
      throw error;
    }
  }
  console.log(
    `Staff: added ${tally.added}, already present ${tally.present}, deleted by an administrator ${tally.deleted}, skipped ${tally.skipped}.`,
  );
  if (unmatched.size > 0) {
    console.log(`  programmes not found, so not linked: ${[...unmatched].join(", ")}`);
  }

  // ------------------------------------------------------------------ executives
  const staffRows = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(eq(staff.status, "published"));
  const staffFor = (name: string) => {
    const matches = staffRows.filter((s) => normalise(s.name) === normalise(name));
    return matches.length === 1 ? matches[0].id : null; // names are not unique: only a sure match
  };
  const presentExecutives = new Set(
    (
      await db
        .select({ key: executives.legacyKey })
        .from(executives)
        .where(
          inArray(
            executives.legacyKey,
            seedExecutives.map((e) => e.id),
          ),
        )
    ).map((r) => r.key),
  );
  const execTally = { added: 0, present: 0, deleted: 0, linked: 0 };

  for (const person of seedExecutives) {
    if (presentExecutives.has(person.id)) {
      execTally.present++;
      continue;
    }
    if (tombstones.has(executiveTombstone(person.id))) {
      execTally.deleted++;
      continue;
    }
    const staffId = staffFor(person.name);
    const images = imageCopier(schema);
    try {
      await db.transaction(async (tx) => {
        const photoId = person.photo ? await images.copy(tx, person.photo) : null;
        await tx.insert(executives).values({
          name: person.name,
          role: person.role,
          scope: person.scope ?? null,
          level: person.level,
          sortOrder: person.order * 10,
          staffId,
          photoId,
          photoAlt: photoId ? person.alt : null,
          status: "published",
          legacyKey: person.id,
        });
      });
      execTally.added++;
      if (staffId) execTally.linked++;
    } catch (error) {
      await images.discard();
      throw error;
    }
  }
  console.log(
    `Executives: added ${execTally.added} (${execTally.linked} linked to their staff record), already present ${execTally.present}, deleted by an administrator ${execTally.deleted}.`,
  );
}
