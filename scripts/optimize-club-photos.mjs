// Usage: node scripts/optimize-club-photos.mjs "<path to the 'Club photos' folder>"
// Needs: npm i -D sharp
// Reads one sub-folder per club, writes web-ready WebP files to public/clubs/<slug>/
// and a manifest to data/club-photos.json. Originals are never modified.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('Pass the path to the "Club photos" folder.');
  process.exit(1);
}

const MAX_PHOTOS = 12;       // per club, keeps the page light
const FULL_WIDTH = 1400;     // px, for the curved band
const THUMB_WIDTH = 360;     // px, for the hover preview on the club list
const QUALITY = 78;
const OUT = path.resolve("public/clubs");
const MANIFEST = path.resolve("data/club-photos.json");

// folder name (lower-case) -> slug used in clubs.json
const SLUGS = {
  "acm": "acm", "bkf": "bkf", "brcs": "brcs", "bto club": "bto", "culture": "culture",
  "e-club": "eclub", "electrical maintenance": "elmaint", "environmental club": "env",
  "gnh club": "gnh", "integrity club": "integrity", "kuenphen tshogpa": "kuenphen",
  "literary club": "literary", "multi-media": "multimedia", "nangpai zhenu club": "nangpai",
  "ndld club": "ndld", "rovers": "rovers", "vocational club": "vocational", "y-peer club": "ypeer",
};
const IMG = /\.(jpe?g|png|webp|tiff?)$/i;
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

const manifest = {};
for (const dir of fs.readdirSync(SRC, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const slug = SLUGS[dir.name.toLowerCase()];
  if (!slug) { console.warn(`Skipped unknown folder: ${dir.name}`); continue; }
  const files = fs.readdirSync(path.join(SRC, dir.name)).filter((f) => IMG.test(f)).sort(natural).slice(0, MAX_PHOTOS);
  const skipped = fs.readdirSync(path.join(SRC, dir.name)).filter((f) => !IMG.test(f) && !f.startsWith("."));
  if (skipped.length) console.warn(`${dir.name}: skipped non-image or unsupported files (${skipped.join(", ")}). Convert HEIC to JPG first.`);

  const target = path.join(OUT, slug);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });

  const photos = [], thumbs = [];
  let n = 0;
  for (const f of files) {
    n += 1;
    const name = String(n).padStart(2, "0");
    const input = path.join(SRC, dir.name, f);
    try {
      await sharp(input).rotate().resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(path.join(target, `${name}.webp`));
      photos.push(`/clubs/${slug}/${name}.webp`);
      if (n <= 2) {
        await sharp(input).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 72 }).toFile(path.join(target, `thumb-${name}.webp`));
        thumbs.push(`/clubs/${slug}/thumb-${name}.webp`);
      }
    } catch (e) {
      console.warn(`${dir.name}/${f}: ${e.message}`);
      n -= 1;
    }
  }
  manifest[slug] = { count: photos.length, photos, thumbs };
  console.log(`${slug}: ${photos.length} photos`);
}
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${MANIFEST}`);
