#!/usr/bin/env node
/**
 * Downloads every image used by the homepage, header and footer from the old WordPress site
 * into public/images/ with clean names, and extracts the few images that the Elementor export
 * only holds inline as base64 data URIs.
 *
 *   node scripts/download-images.mjs           # skip files that already exist
 *   node scripts/download-images.mjs --force   # download everything again
 *
 * The inline images are read from elementor-export/ (git-ignored). If that folder is missing
 * they are skipped with a warning. The app itself never references the old server.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "images");
const EXPORT_DIR = path.join(ROOT, "elementor-export", "kit");
const OLD_UPLOADS = "http://103.133.216.212/wp-content/uploads";
const force = process.argv.includes("--force");

/** Remote images: [path under wp-content/uploads, output path under public/images]. */
const REMOTE = [
  // Brand (header and footer)
  ["2026/10/SJ_Logo.jpg", "brand/silver-jubilee-logo.jpg"],
  ["2026/08/cropped-cstlogo176.png", "brand/cst-crest.png"],

  // About, Mission & Vision
  ["2026/10/cstbirdview.jpg", "home/campus-aerial-view.jpg"],
  ["2026/10/Practical-1.jpg", "home/surveying-practical.jpg"],
  ["2026/10/std-1.jpg", "home/students-walking-on-campus.jpg"],

  // Facilities
  ["2026/10/lib_2.jpg", "home/library-study.jpg"],
  ["2026/10/Lab_2.jpg", "home/laboratory-workshop.jpg"],
  ["2026/10/RK.jpg", "home/residential-blocks.jpg"],
  ["2026/10/BBall.jpg", "home/indoor-basketball.jpg"],
  ["2026/10/Exhcnage.jpg", "home/international-conference.jpg"],
  ["2026/10/health.jpg", "home/health-awareness-day.jpg"],

  // Opportunities
  ["2026/10/Graduate-1.jpg", "home/graduation-ceremony.jpg"],
  ["2026/10/MANID.jpg", "home/prayer-wheel-pavilion.jpg"],

  // Campus gallery (std-1.jpg is reused from Mission & Vision)
  ["2026/10/std_@.jpg", "gallery/students-on-campus-road.jpg"],
  ["2026/10/Practical_2-1.jpg", "gallery/drone-survey-practical.jpg"],
  ["2026/10/LAb_class.jpg", "gallery/computer-lab-class.jpg"],
  ["2026/10/CST.jpg", "gallery/campus-rooftop-view.jpg"],
  ["2026/10/ADM.jpg", "gallery/academic-block.jpg"],
  ["2026/10/Talk.jpg", "gallery/guest-lecture.jpg"],
  ["2026/10/Convention.jpg", "gallery/convention-hall.jpg"],
  ["2026/10/DAnce-1.jpg", "gallery/cultural-dance.jpg"],
  ["2026/10/Fashion.png", "gallery/traditional-dress-show.png"],

  // Leadership
  ["2026/10/president-1.jpg", "leadership/president-tshewang-lhendup.jpg"],
];

/**
 * Inline images (the hero's photo underlay is the same aerial view as campus-aerial-view.jpg, so
 * only the line drawing needs extracting): the export file, the Elementor element id holding the data URI, which data
 * URI within that element (0-based), and the output path.
 */
const EMBEDDED = [["content/page/542.json", "45c20a5c", 0, "home/tower-bridge-drawing.png"]];

const DATA_URI = /data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)/g;

function findElement(elements, id) {
  for (const el of elements ?? []) {
    if (el.id === id) return el;
    const found = findElement(el.elements, id);
    if (found) return found;
  }
  return null;
}

/** Reads width and height from a PNG or JPEG header, without any dependency. */
function imageSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const length = buf.readUInt16BE(i + 2);
      // SOF0-SOF15, except DHT (C4), JPG (C8) and DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + length;
    }
  }
  return null;
}

async function save(out, buf) {
  const file = path.join(OUT_DIR, out);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
}

async function main() {
  const results = [];
  const failures = [];

  for (const [src, out] of REMOTE) {
    const file = path.join(OUT_DIR, out);
    if (!force && existsSync(file)) {
      results.push({ out, status: "exists", buf: await readFile(file) });
      continue;
    }
    const url = `${OLD_UPLOADS}/${src}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!imageSize(buf)) throw new Error("response is not a PNG or JPEG image");
      await save(out, buf);
      results.push({ out, status: "downloaded", buf });
    } catch (err) {
      failures.push({ source: url, out, reason: err.message });
    }
  }

  const docs = new Map();
  for (const [doc, id, index, out] of EMBEDDED) {
    const file = path.join(OUT_DIR, out);
    if (!force && existsSync(file)) {
      results.push({ out, status: "exists", buf: await readFile(file) });
      continue;
    }
    const source = `elementor-export/kit/${doc} #${id}`;
    try {
      if (!docs.has(doc)) {
        docs.set(doc, JSON.parse(await readFile(path.join(EXPORT_DIR, doc), "utf8")));
      }
      const el = findElement(docs.get(doc).content, id);
      if (!el) throw new Error("element not found");
      const match = [...JSON.stringify(el.settings).matchAll(DATA_URI)][index];
      if (!match) throw new Error(`data URI #${index} not found`);
      const buf = Buffer.from(match[2], "base64");
      await save(out, buf);
      results.push({ out, status: "extracted", buf });
    } catch (err) {
      failures.push({
        source,
        out,
        reason: err.code === "ENOENT" ? "export not found" : err.message,
      });
    }
  }

  console.log("\nImages in public/images/:\n");
  for (const { out, status, buf } of results) {
    const size = imageSize(buf);
    const dims = size ? `${size.width}x${size.height}` : "?";
    console.log(
      `  ${status.padEnd(10)} ${dims.padStart(10)}  ${(buf.length / 1024).toFixed(0).padStart(5)} KB  ${out}`,
    );
  }

  if (failures.length) {
    console.error(`\n${failures.length} image(s) failed:\n`);
    for (const f of failures) console.error(`  ${f.out}\n    from ${f.source}\n    ${f.reason}`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${results.length} images are present.`);
  }
}

await main();
