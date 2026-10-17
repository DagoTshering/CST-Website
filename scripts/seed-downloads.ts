/**
 * Seeds the Downloads page from the previous website's downloads, as fetched by
 * `pnpm downloads:fetch` into data/legacy-downloads/ (manifest.json and files/).
 *
 * - Categories are created in the old page's order while there are none.
 * - Each download is added once, published, identified by a key derived from its category,
 *   group, title and original URL. One an administrator has deleted is not added again (its
 *   key is in seed_tombstones), and an edited one is left alone.
 * - PDFs are copied into the upload store (UPLOAD_DIR) and recorded in `media`. An entry whose
 *   file is missing, or that failed to download, is skipped with a message; the seed does not
 *   fail because of it.
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";

import { count, inArray } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";
import { uploadPath } from "../src/lib/media/paths";

type Db = ReturnType<typeof getDb>;

type ManifestItem = {
  category: string;
  group: string | null;
  title: string;
  sourceUrl: string;
  kind: "file" | "link";
  url: string;
  file: string | null;
  status: "ok" | "failed";
  note: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data/legacy-downloads");

/** The old site's section whose downloads are filed under a programme. */
const PROJECT_REPORTS = "Students Project Reports";

/** Must match legacyTombstone() in src/lib/cms/resources/downloads.ts. */
const tombstone = (key: string) => `download:${key}`;

const legacyKey = (item: ManifestItem) =>
  createHash("sha256")
    .update([item.category, item.group ?? "", item.title, item.sourceUrl].join("\n"))
    .digest("hex");

/** "STUDENT HANDBOOK 2026-2027" -> "STUDENT HANDBOOK 2026-2027.pdf", safe as a file name. */
const fileName = (title: string) =>
  `${
    title
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200) || "download"
  }.pdf`;

export async function seedDownloads(db: Db, schema: typeof Schema) {
  const { downloadCategories, downloads, media, programmes, seedTombstones } = schema;
  const manifestPath = path.join(DATA_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.log("Downloads: no manifest (run `pnpm downloads:fetch`); skipped.");
    return;
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { items: ManifestItem[] };

  // Categories, in the order they first appear, while there are none yet.
  const [{ n: categoryCount }] = await db.select({ n: count() }).from(downloadCategories);
  if (categoryCount === 0) {
    const names = [...new Set(manifest.items.map((item) => item.category))];
    await db.insert(downloadCategories).values(
      names.map((name, i) => ({
        name,
        groupByProgramme: name === PROJECT_REPORTS,
        sortOrder: (i + 1) * 10,
      })),
    );
    console.log(`Download categories: seeded ${names.length}.`);
  } else {
    console.log("Download categories: already exist; left unchanged.");
  }
  const categoryRows = await db
    .select({
      id: downloadCategories.id,
      name: downloadCategories.name,
      groupByProgramme: downloadCategories.groupByProgramme,
    })
    .from(downloadCategories);
  const categoryIds = new Map(categoryRows.map((c) => [c.name, c.id]));
  const groupedByProgramme = new Set(
    categoryRows.filter((c) => c.groupByProgramme).map((c) => c.id),
  );

  // The old site names a project report's department ("Civil Engineering", "ME Renewable
  // Energy"); it is filed under the programme whose name ends with that (as migration 0003 does).
  const programmeRows = await db
    .select({ id: programmes.id, name: programmes.name })
    .from(programmes);
  const programmeFor = (group: string | null) => {
    if (!group) return null;
    const ending = group.replace(/^ME /, "").toLowerCase();
    return programmeRows.find((p) => p.name.toLowerCase().endsWith(ending))?.id ?? null;
  };

  const keys = manifest.items.map(legacyKey);
  const present = new Set(
    (
      await db
        .select({ key: downloads.legacyKey })
        .from(downloads)
        .where(inArray(downloads.legacyKey, keys))
    ).map((row) => row.key),
  );
  const deleted = new Set(
    (
      await db
        .select({ key: seedTombstones.key })
        .from(seedTombstones)
        .where(inArray(seedTombstones.key, keys.map(tombstone)))
    ).map((row) => row.key),
  );

  const tally = { added: 0, present: 0, deleted: 0, skipped: 0 };
  const position = new Map<string, number>();

  for (const [i, item] of manifest.items.entries()) {
    const key = keys[i];
    const order = (position.get(item.category) ?? 0) + 10;
    position.set(item.category, order);

    if (present.has(key)) {
      tally.present++;
      continue;
    }
    if (deleted.has(tombstone(key))) {
      tally.deleted++;
      continue;
    }
    const categoryId = categoryIds.get(item.category);
    const skip = (why: string) => {
      tally.skipped++;
      console.log(`  skipped "${item.title}" (${item.category}): ${why}`);
    };
    if (!categoryId) {
      skip("its category no longer exists");
      continue;
    }
    if (item.status !== "ok") {
      skip(`it could not be fetched (${item.note})`);
      continue;
    }

    const programmeId = groupedByProgramme.has(categoryId) ? programmeFor(item.group) : null;
    if (groupedByProgramme.has(categoryId) && !programmeId) {
      console.log(
        `  "${item.title}" (${item.group}): no matching programme; kept its group heading`,
      );
    }
    const common = {
      title: item.title,
      categoryId,
      programmeId,
      groupLabel: programmeId ? null : item.group,
      sortOrder: order,
      status: "published" as const,
      legacyKey: key,
    };

    if (item.kind === "link") {
      await db
        .insert(downloads)
        .values({ ...common, kind: "link", externalUrl: item.url })
        .onConflictDoNothing({ target: downloads.legacyKey });
      tally.added++;
      continue;
    }

    const source = item.file ? path.join(DATA_DIR, "files", item.file) : null;
    if (!source || !existsSync(source)) {
      skip("its PDF is not in data/legacy-downloads/files (run `pnpm downloads:fetch`)");
      continue;
    }

    const storageKey = `${randomUUID()}.pdf`;
    const target = uploadPath(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    try {
      const { size } = await stat(target);
      await db.transaction(async (tx) => {
        const [file] = await tx
          .insert(media)
          .values({
            kind: "document",
            storageKey,
            originalName: fileName(item.title),
            mimeType: "application/pdf",
            byteSize: size,
          })
          .returning({ id: media.id });
        await tx.insert(downloads).values({ ...common, kind: "file", fileId: file.id });
      });
      tally.added++;
    } catch (error) {
      await unlink(target).catch(() => {});
      throw error;
    }
  }

  const [{ n: total }] = await db.select({ n: count() }).from(downloads);
  console.log(
    `Downloads: added ${tally.added}, already present ${tally.present}, deleted by an administrator ${tally.deleted}, skipped ${tally.skipped} (${total} in total).`,
  );
}
