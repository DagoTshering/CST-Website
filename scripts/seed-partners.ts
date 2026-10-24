/**
 * Seeds the Partners page (/about/partners) from data/partners.json, the partners merged from the
 * college presentation: 37 international and 22 national.
 *
 * - The partners are seeded only while the table is empty, so rerunning the seed never
 *   overwrites or duplicates partners edited in the admin panel.
 * - Each is published, numbered 10, 20, 30, … within its category in the file's displayOrder.
 * - A row's `logo` (a file in public/images/partners, from the organisation's Wikipedia article)
 *   is copied into the upload store, as if uploaded in the admin panel; without one, the page
 *   shows the partner's initials.
 * - A row's `toConfirm` (what still needs checking with the college) is not stored; it stays in
 *   the JSON. Nor is `website`, empty for now: administrators add them.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { count } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";
import type { PartnerCategory, PartnerType } from "../src/lib/db/schema";
import { imageCopier } from "./seed-images";

type Db = ReturnType<typeof getDb>;

type SeedPartner = {
  name: string;
  category: PartnerCategory;
  /** "University", "Research", … as in the presentation. */
  type: string;
  city: string | null;
  country: string;
  note: string | null;
  website: string | null;
  /** A path under public/, e.g. "/images/partners/lund-university.png". */
  logo: string | null;
  displayOrder: number;
  toConfirm: string | null;
};

const TYPES: PartnerType[] = [
  "university",
  "research",
  "government",
  "industry",
  "foundation",
  "programme",
  "finance",
];

export async function seedPartners(db: Db, schema: typeof Schema) {
  const { partners } = schema;

  const [{ n }] = await db.select({ n: count() }).from(partners);
  if (n > 0) {
    console.log("Partners: already exist; left unchanged.");
    return;
  }

  const data = JSON.parse(
    await readFile(path.join(process.cwd(), "data/partners.json"), "utf8"),
  ) as SeedPartner[];

  const position = { international: 0, national: 0 };
  const sorted = [...data].sort((a, b) => a.displayOrder - b.displayOrder);
  for (const p of sorted) {
    if (!TYPES.includes(p.type.toLowerCase() as PartnerType)) {
      throw new Error(`Partners: unknown type "${p.type}" (${p.name}).`);
    }
  }

  // Logos are copied into the upload store; removed again if the transaction fails.
  const images = imageCopier(schema);
  try {
    await db.transaction(async (tx) => {
      const rows = [];
      for (const p of sorted) {
        position[p.category] += 10;
        rows.push({
          name: p.name,
          category: p.category,
          type: p.type.toLowerCase() as PartnerType,
          city: p.city,
          country: p.country,
          note: p.note,
          logoId: p.logo ? await images.copy(tx, p.logo) : null,
          sortOrder: position[p.category],
          status: "published" as const,
        });
      }
      await tx.insert(partners).values(rows);
    });
  } catch (error) {
    await images.discard();
    throw error;
  }
  console.log(
    `Partners: seeded ${sorted.length} (${position.international / 10} international, ${position.national / 10} national), ${images.written.length} with a logo.`,
  );
}
