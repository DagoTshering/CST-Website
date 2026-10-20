/**
 * Fills in the About page (/about) from data/about.json, the content the static page was built
 * from (a copy of docs/reference/about.json; its `meta.notes` list what is still to be confirmed
 * with the college).
 *
 * - The page's text is added while there is none. The headings are the ones the static page had.
 * - The college's names are added while there are none, and so are the centres (published).
 * - Nothing an administrator has written or changed is replaced. The programme counts are not
 *   stored: the page counts the programmes in Academic Programmes.
 * - No photos: the page shows placeholder frames until they are uploaded.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { count } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";

type Db = ReturnType<typeof getDb>;

type AboutData = {
  paragraphs: [string, string, string, string];
  names: { year: string; name: string; note: string }[];
  vision: string;
  pillars: string[];
  numbers: { planned: string | null };
  services: string[];
  centres: {
    group: "research" | "innovation";
    acronym: string;
    fullName: string | null;
    text: string | null;
  }[];
};

export async function seedAboutPage(db: Db, schema: typeof Schema) {
  const { aboutPage, collegeNames, researchCentres } = schema;
  const data = JSON.parse(
    await readFile(path.join(process.cwd(), "data/about.json"), "utf8"),
  ) as AboutData;
  const [intro, vision, offer, research] = data.paragraphs;

  const [{ n: pages }] = await db.select({ n: count() }).from(aboutPage);
  if (pages === 0) {
    await db.insert(aboutPage).values({
      introHeading: "A college of the Royal University of Bhutan",
      introEmphasis: "Bhutan",
      introText: intro,
      namesHeading: "Three names, one college",
      namesEmphasis: "one college",
      namesText:
        "From a polytechnic in 1974 to the College of Science and Technology we know today.",
      vision: data.vision,
      visionEmphasis: data.vision.includes("Excellence") ? "Excellence" : null,
      visionText: vision,
      pillars: data.pillars,
      offerHeading: "Programmes, training and research",
      offerText: offer,
      plannedProgramme: data.numbers.planned,
      services: data.services,
      centresHeading: "Where ideas get built and tested",
      centresEmphasis: "built",
      centresText: research,
    });
    console.log("About page: seeded.");
  } else {
    console.log("About page: already has content; left unchanged.");
  }

  const [{ n: names }] = await db.select({ n: count() }).from(collegeNames);
  if (names === 0) {
    await db
      .insert(collegeNames)
      .values(
        data.names.map((n) => ({ year: Number(n.year), name: n.name, note: n.note || null })),
      );
    console.log(`About page names: seeded ${data.names.length}.`);
  }

  const [{ n: centres }] = await db.select({ n: count() }).from(researchCentres);
  if (centres === 0) {
    const position = { research: 0, innovation: 0 };
    await db.insert(researchCentres).values(
      data.centres.map((c) => ({
        group: c.group,
        acronym: c.acronym,
        fullName: c.fullName,
        description: c.text,
        sortOrder: (position[c.group] += 10),
        status: "published" as const,
      })),
    );
    console.log(`About page centres: seeded ${data.centres.length}.`);
  }
}
