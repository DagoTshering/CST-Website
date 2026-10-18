#!/usr/bin/env node
/**
 * Downloads the staff directory's portraits from the old WordPress site into
 * public/images/staff/<id>.jpg and points src/content/staff.json at them.
 *
 *   node scripts/download-staff-photos.mjs           # skip photos that already exist
 *   node scripts/download-staff-photos.mjs --force   # download every photo again
 *
 * The directory data links WordPress's small thumbnails (e.g. Name-261x300.jpg). For each person
 * this tries the full-size original first (the same path without the -WxH suffix) and falls back
 * to the thumbnail, then re-encodes it with sharp: turned upright, at most 640x800, metadata
 * stripped. The source address comes from the entry itself while it is still a URL, otherwise
 * from docs/reference/staff.json (the untouched copy), so the script can be rerun at any time.
 *
 * Only the `image` field of src/content/staff.json is changed. A person whose photo cannot be
 * fetched gets `image: null`, and the page shows their initials instead.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = path.join(ROOT, "src", "content", "staff.json");
const REFERENCE_FILE = path.join(ROOT, "docs", "reference", "staff.json");
const OUT_DIR = path.join(ROOT, "public", "images", "staff");
const PUBLIC_PATH = "/images/staff";
const MAX = { width: 640, height: 800 };
const CONCURRENCY = 6;
const force = process.argv.includes("--force");

/**
 * Photos the old site (and so docs/reference/staff.json) gives to the wrong person. The two Nima
 * Yoezers in Computing Technologies are shown with each other's photo; corrected by the college,
 * October 2026.
 */
const PHOTO_FIXES = {
  "nimayoezer.cst": "https://cst.edu.bt/wp-content/uploads/2026/09/651A0963-241x300.jpg",
  "nimayoezer1.cst": "https://cst.edu.bt/wp-content/uploads/2026/09/651A1030-227x300.jpg",
};

const isUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);

/** The original upload behind a WordPress thumbnail URL, or null if it is not a thumbnail. */
const originalOf = (url) => {
  const original = url.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");
  return original === url ? null : original;
};

async function fetchImage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type || "no content type"})`);
  return Buffer.from(await res.arrayBuffer());
}

/** The same address with the other JPEG extension: some entries record .jpeg for a .jpg upload. */
const otherJpeg = (url) =>
  /\.jpe?g$/i.test(url)
    ? url.replace(/\.(jpe?g)$/i, (_, ext) => (/^jpeg$/i.test(ext) ? ".jpg" : ".jpeg"))
    : null;

async function download(person, source) {
  const file = path.join(OUT_DIR, `${person.id}.jpg`);
  const urls = [originalOf(source), source].filter(Boolean);
  const attempts = [...urls, ...urls.map(otherJpeg).filter(Boolean)];
  const errors = [];
  for (const url of attempts) {
    try {
      const input = await fetchImage(url);
      const { data, info } = await sharp(input)
        .rotate()
        .resize({ ...MAX, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      await writeFile(file, data);
      return {
        status: url === source ? "thumbnail" : "original",
        size: `${info.width}x${info.height}`,
        kb: Math.round(data.length / 1024),
      };
    } catch (err) {
      errors.push(`${url}: ${err.message}`);
    }
  }
  throw new Error(errors.join("\n    "));
}

/** Runs `task` over `items`, at most `limit` at a time. */
async function pool(items, limit, task) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  });
  await Promise.all(workers);
}

async function main() {
  const data = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const reference = JSON.parse(await readFile(REFERENCE_FILE, "utf8"));
  const sources = new Map(reference.staff.map((p) => [p.id, p.image]));
  await mkdir(OUT_DIR, { recursive: true });

  const counts = { original: 0, thumbnail: 0, exists: 0 };
  const failures = [];

  await pool(data.staff, CONCURRENCY, async (person) => {
    const local = `${PUBLIC_PATH}/${person.id}.jpg`;
    const file = path.join(OUT_DIR, `${person.id}.jpg`);
    if (!force && existsSync(file)) {
      person.image = local;
      counts.exists++;
      return;
    }
    const source =
      PHOTO_FIXES[person.id] ?? (isUrl(person.image) ? person.image : sources.get(person.id));
    if (!isUrl(source)) {
      failures.push({ person, reason: "no source URL" });
      person.image = null;
      return;
    }
    try {
      const result = await download(person, source);
      counts[result.status]++;
      person.image = local;
      console.log(
        `  ${result.status.padEnd(9)} ${result.size.padStart(9)} ${String(result.kb).padStart(4)} KB  ${person.id}`,
      );
    } catch (err) {
      failures.push({ person, reason: err.message });
      person.image = null;
    }
  });

  await writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);

  console.log(
    `\n${counts.original} from originals, ${counts.thumbnail} from thumbnails, ${counts.exists} already present.`,
  );
  if (failures.length) {
    console.error(`\n${failures.length} photo(s) failed; these people will show initials:\n`);
    for (const { person, reason } of failures) console.error(`  ${person.id}\n    ${reason}`);
    process.exitCode = 1;
  }
}

await main();
