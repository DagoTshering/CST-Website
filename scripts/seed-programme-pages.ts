/**
 * Fills in the programmes' pages (/programmes/<slug>) from data/programmes/programmes.json, the
 * content the static pages were built from (a copy of docs/reference/programmes.json).
 *
 * - Each entry is matched to its programme in Academic Programmes by the explicit list below
 *   (the names differ slightly, e.g. "Water Resource" / "Water Resources").
 * - A programme's page details are filled in once, while it has no page yet (no slug), with its
 *   modules and facilities. One an administrator has already given a page is left alone.
 *
 * Not imported: the full semester-by-semester curriculum three programmes have in the JSON. The
 * pages never showed it; it stays in the JSON.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";

type Db = ReturnType<typeof getDb>;

type SeedProgramme = {
  slug: string;
  name: string;
  degree: string;
  duration: string;
  since: string | null;
  departmentKey: string | null;
  departmentUrl: string;
  documentUrl: string | null;
  summary: string;
  outcomes: string[];
  structure:
    | { kind: "none" }
    | {
        kind: "modules";
        intro: string | null;
        note: string | null;
        modules: {
          name: string;
          description: string | null;
          descriptionSource: "site" | "draft" | null;
          code: string | null;
        }[];
      };
  requirements: string[] | null;
  selectionNote: string | null;
  careers: string[] | null;
  facilities: { name: string; description: string }[] | null;
};

/** Each programme page's programme, by its name in Academic Programmes. */
const PROGRAMME_NAME: Record<string, string> = {
  architecture: "Bachelor of Architecture",
  "civil-engineering": "Bachelor of Engineering in Civil Engineering",
  "engineering-geology": "Bachelor of Engineering in Engineering Geology",
  "water-resource-engineering": "Bachelor of Engineering in Water Resources Engineering",
  "electrical-engineering": "Bachelor of Engineering in Electrical Engineering",
  "electronics-and-communication":
    "Bachelor of Engineering in Electronics and Communication Engineering",
  "instrumentation-and-control-engineering":
    "Bachelor of Engineering in Instrumentation and Control Engineering",
  "mechanical-engineering": "Bachelor of Engineering in Mechanical Engineering",
  "information-technology": "Bachelor of Engineering in Information Technology",
  "software-engineering": "Bachelor of Engineering in Software Engineering",
  "renewable-energy": "Master of Engineering in Renewable Energy",
  "construction-management": "Master of Engineering in Construction Management",
  "msc-engineering": "Master by Research in Engineering",
};

/** The programme sites' department keys, as the Staff Directory's departments. */
const DEPARTMENT_CODE: Record<string, string> = {
  AD: "ARCH",
  CEED: "CEED",
  EEED: "EEED",
  MED: "MECH",
  CTD: "CTD",
};

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** "July 2014" -> { month: 7, year: 2014 } */
function parseSince(since: string | null) {
  const match = since?.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return { month: null, year: null };
  const month = MONTHS.indexOf(match[1].toLowerCase()) + 1;
  return { month: month || null, year: Number(match[2]) };
}

export async function seedProgrammePages(db: Db, schema: typeof Schema) {
  const { departments, programmeFacilities, programmeModules, programmes } = schema;
  const data = JSON.parse(
    await readFile(path.join(process.cwd(), "data/programmes/programmes.json"), "utf8"),
  ) as { programmes: SeedProgramme[] };

  const departmentIds = new Map(
    (await db.select({ id: departments.id, code: departments.code }).from(departments)).map((d) => [
      d.code,
      d.id,
    ]),
  );

  // ---------------------------------------------------------------- programme pages
  const tally = { filled: 0, present: 0, missing: [] as string[] };
  for (const p of data.programmes) {
    const name = PROGRAMME_NAME[p.slug];
    const [row] = name
      ? await db
          .select({
            id: programmes.id,
            slug: programmes.slug,
            startYear: programmes.startYear,
            summary: programmes.shortDescription,
          })
          .from(programmes)
          .where(eq(programmes.name, name))
          .limit(1)
      : [];
    if (!row) {
      tally.missing.push(p.slug);
      continue;
    }
    if (row.slug) {
      tally.present++;
      continue;
    }
    const [taken] = await db
      .select({ id: programmes.id })
      .from(programmes)
      .where(eq(programmes.slug, p.slug))
      .limit(1);
    if (taken) {
      tally.present++;
      continue;
    }

    const since = parseSince(p.since);
    const structure = p.structure.kind === "modules" ? p.structure : null;
    await db.transaction(async (tx) => {
      await tx
        .update(programmes)
        .set({
          slug: p.slug,
          shortName: p.name,
          degree: p.degree,
          duration: p.duration,
          startMonth: since.month,
          startYear: row.startYear ?? since.year,
          departmentId: p.departmentKey
            ? (departmentIds.get(DEPARTMENT_CODE[p.departmentKey]) ?? null)
            : null,
          websiteUrl: p.departmentUrl,
          documentUrl: p.documentUrl,
          shortDescription: row.summary ?? p.summary,
          outcomes: p.outcomes,
          requirements: p.requirements ?? [],
          selectionNote: p.selectionNote,
          careers: p.careers ?? [],
          structureIntro: structure?.intro ?? null,
          structureNote: structure?.note ?? null,
        })
        .where(eq(programmes.id, row.id));
      if (structure && structure.modules.length > 0) {
        await tx.insert(programmeModules).values(
          structure.modules.map((m, i) => ({
            programmeId: row.id,
            name: m.name,
            description: m.description,
            code: m.code,
            descriptionConfirmed: m.descriptionSource !== "draft",
            sortOrder: (i + 1) * 10,
          })),
        );
      }
      if (p.facilities && p.facilities.length > 0) {
        await tx.insert(programmeFacilities).values(
          p.facilities.map((f, i) => ({
            programmeId: row.id,
            name: f.name,
            description: f.description,
            sortOrder: (i + 1) * 10,
          })),
        );
      }
    });
    tally.filled++;
  }
  console.log(
    `Programme pages: filled in ${tally.filled}, already had a page ${tally.present}.` +
      (tally.missing.length ? ` No programme for: ${tally.missing.join(", ")}.` : ""),
  );
}
