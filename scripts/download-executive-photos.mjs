#!/usr/bin/env node
/**
 * Downloads the executives' portraits from the old WordPress site into
 * public/images/executives/<id>.jpg, as src/content/executives.json expects them.
 *
 *   node scripts/download-executive-photos.mjs           # skip photos that already exist
 *   node scripts/download-executive-photos.mjs --force   # download every photo again
 *
 * The old Executives page links resized copies (e.g. Name-909x1024.jpg); the portraits are shown
 * large, so this takes the full-size original first (the same path without the -WxH suffix) and
 * falls back to the linked copy. Each is re-encoded with sharp: turned upright, cropped (CROPS)
 * or framed (FRAMES) to a square portrait, at most 900px on its longer side, as JPEG, metadata
 * stripped. If one cannot be fetched, the page shows initials.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "images", "executives");
const MAX = 900;
const force = process.argv.includes("--force");

/** id (as in executives.json) -> the photo the old site's Executives page shows. */
const SOURCES = {
  "tshewang-lhendup":
    "https://cst.edu.bt/wp-content/uploads/2026/07/Screenshot-2026-07-02-125540-1.png",
  chimi: "https://cst.edu.bt/wp-content/uploads/2025/09/Chimi-arch-1003x1024.jpg",
  "sangey-pasang":
    "https://cst.edu.bt/wp-content/uploads/2025/02/Dr.-Sangey-Pasang-e1753980708795-909x1024.jpg",
  "kelzang-dorji":
    "https://cst.edu.bt/wp-content/uploads/2025/02/Kelzang-Dorji-scaled-e1753980742486-909x1024.jpg",
};

/**
 * The Deans' photos are wide studio shots with the person small in the middle; in a round dial
 * the face would read small. Each is cropped to a square of head and shoulders, as shares of the
 * original's width (left, size) and height (top). The President's photo is already a close-up.
 */
const CROPS = {
  chimi: { left: 0.16, top: 0.05, size: 0.6 },
  "sangey-pasang": { left: 0.2, top: 0.04, size: 0.6 },
  "kelzang-dorji": { left: 0.2, top: 0.05, size: 0.6 },
};

/**
 * The President's photo is a tall screenshot on white, with no room above the head (a dial,
 * cropping from the top, would show hair to chin against the ring) and a dark speck in its
 * top-left corner. It is trimmed (px off every edge but the bottom), cut below the shoulders
 * (keep: the share of the height kept), and given white headroom (a share of what is kept) and
 * white sides to make a square: a head-and-shoulders portrait, the head centred.
 */
const FRAMES = {
  "tshewang-lhendup": { trim: 12, keep: 0.9, headroom: 0.12 },
};

/** The original upload behind a WordPress resized copy, or null if the URL is not one. */
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

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const failures = [];
  for (const [id, source] of Object.entries(SOURCES)) {
    const file = path.join(OUT_DIR, `${id}.jpg`);
    if (!force && existsSync(file)) {
      console.log(`  exists                ${id}`);
      continue;
    }
    const errors = [];
    let done = false;
    for (const url of [originalOf(source), source].filter(Boolean)) {
      try {
        const input = await sharp(await fetchImage(url))
          .rotate()
          .toBuffer();
        const crop = CROPS[id];
        const frame = FRAMES[id];
        let image = sharp(input);
        if (frame) {
          const { width, height } = await image.metadata();
          const w = width - 2 * frame.trim;
          const h = Math.round((height - frame.trim) * frame.keep);
          const top = Math.round(h * frame.headroom);
          const sides = h + top - w;
          image = sharp(
            await image
              .extract({ left: frame.trim, top: frame.trim, width: w, height: h })
              .extend({
                top,
                left: Math.floor(sides / 2),
                right: Math.ceil(sides / 2),
                background: "#ffffff",
              })
              .toBuffer(),
          );
        }
        if (crop) {
          const { width, height } = await image.metadata();
          const side = Math.round(width * crop.size);
          image = sharp(
            await image
              .extract({
                left: Math.round(width * crop.left),
                top: Math.round(height * crop.top),
                width: side,
                height: Math.min(side, height - Math.round(height * crop.top)),
              })
              .toBuffer(),
          );
        }
        const { data, info } = await image
          .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
          .flatten({ background: "#ffffff" }) // a PNG's transparency on white
          .jpeg({ quality: 84, mozjpeg: true })
          .toBuffer({ resolveWithObject: true });
        await writeFile(file, data);
        const kind = url === source ? "linked copy" : "original";
        console.log(
          `  ${kind.padEnd(11)} ${`${info.width}x${info.height}`.padStart(9)}  ${id} (${Math.round(data.length / 1024)} KB)`,
        );
        done = true;
        break;
      } catch (err) {
        errors.push(`${url}: ${err.message}`);
      }
    }
    if (!done) failures.push({ id, reason: errors.join("\n    ") });
  }
  if (failures.length) {
    console.error(`\n${failures.length} photo(s) failed; these people will show initials:\n`);
    for (const f of failures) console.error(`  ${f.id}\n    ${f.reason}`);
    process.exitCode = 1;
  }
}

await main();
