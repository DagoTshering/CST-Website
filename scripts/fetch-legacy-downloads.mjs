/**
 * Fetches the downloads listed on the previous website (https://cst.edu.bt/downloads/) so they
 * can be seeded into the new site.
 *
 *   pnpm downloads:fetch
 *
 * 1. Reads the page and lists its links in page order, by section (and, for the students'
 *    project reports, by department). Only links inside the page's main content are taken; the
 *    old page also carries unrelated (spam) links elsewhere, which are reported and ignored.
 * 2. Resolves each link: Google Drive files are downloaded, Google Docs/Slides are exported as
 *    PDF, short links are followed, and Drive folders and web pages are kept as links.
 * 3. Keeps a file only if it really is a PDF (it must start with %PDF-). A Word file, or one
 *    not shared publicly, is kept as a link to the original; one that no longer exists is
 *    reported as failed and left out.
 * 4. Writes data/legacy-downloads/manifest.json (committed) and the PDFs to
 *    data/legacy-downloads/files/ (not committed; see README).
 *
 * Resumable: a file already on disk with the recorded SHA-256 is not fetched again. Fetches run
 * one at a time with a pause between them. A failure is recorded and the script carries on.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://cst.edu.bt/downloads/";
const OUT_DIR = path.resolve("data/legacy-downloads");
const FILES_DIR = path.join(OUT_DIR, "files");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const USER_AGENT = "Mozilla/5.0 (compatible; CST-website-migration)";
const PAUSE_MS = 600;
const TIMEOUT_MS = 120_000;

/** Section headings written as bold paragraphs on the old page. */
const PARAGRAPH_SECTIONS = [
  "Research Related Documents",
  "RUB Regulation Documents",
  "CST Newsletter",
  "CST Magazine",
];
/** The old page's spelling, corrected. */
const CORRECTIONS = {
  "Students Project reports": "Students Project Reports",
  "ME-Reneable Energy": "ME Renewable Energy",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Why a file could not be taken. With `keepAsLink`, the original still works for some people
 * (a Word form, or a file shared only within CST's Google domain), so the entry is kept as a
 * link to it; otherwise (gone, or a network error) it is reported as failed.
 */
class FetchProblem extends Error {
  constructor(message, keepAsLink) {
    super(message);
    this.keepAsLink = keepAsLink;
  }
}

const decode = (s) =>
  s
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ");

const text = (html) =>
  decode(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const correct = (name) => CORRECTIONS[name] ?? name;

/** A link's text as a title, without the list number some links carry ("3. 7-3-…"). */
const title = (html) => text(html).replace(/^\d+\.\s+/, "");

// ---------------------------------------------------------------------------- parse

/** The links in the page's main content, with their section and group, in page order. */
function parse(html) {
  const start = html.indexOf('<h1 class="entry-title">');
  const end = html.indexOf("</main>", start);
  if (start < 0 || end < 0) throw new Error("Could not find the page's main content");
  const main = html.slice(start, end);

  const items = [];
  let category = null;
  let group = null;
  // Headings, paragraphs (section titles and department names) and links, in document order.
  const token =
    /<h[23][^>]*>([\s\S]*?)<\/h[23]>|<p[^>]*>([\s\S]*?)<\/p>|<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of main.matchAll(token)) {
    const [, heading, paragraph, href, label] = match;
    if (heading !== undefined) {
      category = correct(text(heading));
      group = null;
    } else if (paragraph !== undefined) {
      const plain = text(paragraph);
      if (PARAGRAPH_SECTIONS.includes(plain)) {
        category = plain;
        group = null;
      } else if (/<a\s/.test(paragraph)) {
        // A paragraph of numbered links ("1. <a>…</a><br>2. …"). The paragraph match has
        // consumed them, so they are taken from it here.
        for (const link of paragraph.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
          items.push({ category, group, title: title(link[2]), url: decode(link[1]) });
        }
      } else {
        const department = plain.match(/^\d+\s*\.\s*(.+)$/);
        if (department) group = correct(department[1].trim());
      }
    } else if (href) {
      items.push({ category, group, title: title(label), url: decode(href) });
    }
  }
  return items;
}

/** Links outside the main content that point away from CST, RUB and Google: likely spam. */
function foreignLinks(html) {
  const start = html.indexOf('<h1 class="entry-title">');
  const end = html.indexOf("</main>", start);
  const outside = html.slice(0, start) + html.slice(end);
  const trusted =
    /^(https?:\/\/)?([a-z0-9-]+\.)*(cst\.edu\.bt|rub\.edu\.bt|google\.com|gov\.bt|facebook\.com|youtube\.com|linkedin\.com|instagram\.com|twitter\.com|x\.com|wordpress\.org|w\.org|gmpg\.org|schema\.org|elementor\.com)(\/|$)/i;
  const found = new Set();
  for (const [, href] of outside.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)) {
    if (!trusted.test(href)) found.add(decode(href));
  }
  return [...found];
}

// ---------------------------------------------------------------------------- resolve

async function request(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      headers: { "user-agent": USER_AGENT, ...init.headers },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Follows a short link (tinyurl) to where it points, without downloading the target. */
async function expand(url) {
  let current = url;
  for (let hops = 0; hops < 8; hops++) {
    const res = await request(current, { method: "HEAD", redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return current;
    current = new URL(location, current).toString();
  }
  return current;
}

/** How to get a link: a file URL to download, or a link to keep as is. */
function classify(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host === "drive.google.com") {
    if (u.pathname.startsWith("/drive/folders/"))
      return { type: "link", reason: "Google Drive folder" };
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? u.searchParams.get("id");
    if (id) {
      return {
        type: "file",
        via: "drive",
        fetchUrl: `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
      };
    }
  }
  if (host === "docs.google.com") {
    const [, kind, id] =
      u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]+)/) ?? [];
    if (kind === "document") {
      return {
        type: "file",
        via: "docs",
        fetchUrl: `https://docs.google.com/document/d/${id}/export?format=pdf`,
      };
    }
    if (kind === "presentation") {
      return {
        type: "file",
        via: "slides",
        fetchUrl: `https://docs.google.com/presentation/d/${id}/export/pdf`,
      };
    }
    if (kind === "spreadsheets") {
      return {
        type: "file",
        via: "sheets",
        fetchUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`,
      };
    }
  }
  if (host === "cst.edu.bt" && /\.pdf$/i.test(u.pathname)) {
    return { type: "file", via: "direct", fetchUrl: url };
  }
  return { type: "link", reason: "web page" };
}

/** What a downloaded file actually is, from its first bytes. */
function sniff(bytes) {
  const head = bytes.subarray(0, 8);
  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (head[0] === 0x50 && head[1] === 0x4b) return "office (zip: docx/xlsx/pptx)";
  if (head.readUInt32BE(0) === 0xd0cf11e0) return "office (legacy doc/xls/ppt)";
  if (/^\s*</.test(head.toString("latin1"))) return "html";
  return "unknown";
}

const slug = (s) =>
  s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "file";

// ---------------------------------------------------------------------------- main

async function main() {
  await mkdir(FILES_DIR, { recursive: true });
  const previous = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : null;
  const known = new Map((previous?.items ?? []).map((item) => [item.sourceUrl, item]));

  console.log(`Reading ${SOURCE}`);
  const page = await (await request(SOURCE)).text();
  const links = parse(page);
  const spam = foreignLinks(page);

  const items = [];
  const usedNames = new Set();
  for (const [index, link] of links.entries()) {
    const label = `${String(index + 1).padStart(3)} ${link.category} › ${link.group ? `${link.group} › ` : ""}${link.title}`;
    const item = {
      category: link.category,
      group: link.group,
      title: link.title,
      sourceUrl: link.url,
      kind: "link",
      url: link.url,
      file: null,
      bytes: null,
      sha256: null,
      status: "ok",
      note: null,
    };

    try {
      let target = link.url;
      if (/^https?:\/\/(www\.)?tinyurl\.com\//i.test(target)) {
        target = await expand(target);
        item.url = target;
        item.note = `short link to ${target}`;
      }
      const how = classify(target);

      if (how.type === "link") {
        item.note = item.note ?? how.reason;
      } else {
        let name = `${slug(link.category)}--${slug(link.title)}.pdf`;
        for (let n = 2; usedNames.has(name); n++)
          name = `${slug(link.category)}--${slug(link.title)}-${n}.pdf`;
        usedNames.add(name);

        const before = known.get(link.url);
        const onDisk = before?.file && existsSync(path.join(FILES_DIR, before.file));
        if (onDisk && before.sha256) {
          const bytes = await readFile(path.join(FILES_DIR, before.file));
          if (createHash("sha256").update(bytes).digest("hex") === before.sha256) {
            Object.assign(item, {
              kind: "file",
              file: before.file,
              bytes: before.bytes,
              sha256: before.sha256,
            });
            console.log(`${label}\n      kept (already downloaded)`);
            items.push(item);
            continue;
          }
        }

        let bytes;
        for (let attempt = 1; ; attempt++) {
          try {
            const res = await request(how.fetchUrl);
            if (res.status === 401 || res.status === 403) {
              throw new FetchProblem(`not shared publicly (HTTP ${res.status})`, true);
            }
            if (res.status === 404 || res.status === 410) {
              throw new FetchProblem(`no longer exists (HTTP ${res.status})`, false);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            bytes = Buffer.from(await res.arrayBuffer());
            break;
          } catch (error) {
            if (error instanceof FetchProblem || attempt >= 3) throw error;
            await sleep(PAUSE_MS * 3 * attempt);
          }
        }

        const type = sniff(bytes);
        if (type !== "pdf") {
          throw new FetchProblem(
            type === "html"
              ? "Google returned a sign-in or warning page instead of the file (not shared publicly)"
              : `not a PDF (${type})`,
            true,
          );
        }
        await writeFile(path.join(FILES_DIR, name), bytes);
        Object.assign(item, {
          kind: "file",
          file: name,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
        if (how.via !== "drive" && how.via !== "direct")
          item.note = `exported from Google ${how.via} as PDF`;
        await sleep(PAUSE_MS);
      }
      console.log(
        `${label}\n      ${item.kind === "file" ? `file ${(item.bytes / 1024 / 1024).toFixed(2)} MB` : `link (${item.note})`}`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (error instanceof FetchProblem && error.keepAsLink) {
        Object.assign(item, {
          kind: "link",
          url: link.url,
          note: `link to the original: ${reason}`,
        });
        console.log(`${label}\n      link to the original (${reason})`);
      } else {
        Object.assign(item, { status: "failed", note: reason });
        console.log(`${label}\n      FAILED: ${reason}`);
      }
    }
    items.push(item);
  }

  // Many project-report years on the old page point at one and the same folder.
  const folderUse = new Map();
  for (const item of items) {
    if (item.kind === "link" && item.url.includes("/drive/folders/")) {
      folderUse.set(item.url, (folderUse.get(item.url) ?? 0) + 1);
    }
  }
  const sharedFolders = [...folderUse]
    .filter(([, n]) => n > 1)
    .map(([url, n]) => ({ url, uses: n }));

  await writeFile(
    MANIFEST,
    JSON.stringify(
      {
        source: SOURCE,
        fetchedAt: new Date().toISOString(),
        items,
        sharedFolders,
        excludedLinks: spam,
      },
      null,
      2,
    ) + "\n",
  );

  const files = items.filter((i) => i.kind === "file");
  const failed = items.filter((i) => i.status === "failed");
  const total = files.reduce((sum, i) => sum + i.bytes, 0);
  const largest = files.reduce((max, i) => (i.bytes > (max?.bytes ?? 0) ? i : max), null);

  console.log("\nSummary");
  const byCategory = new Map();
  for (const i of items) byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
  for (const [category, n] of byCategory) console.log(`  ${category}: ${n}`);
  console.log(
    `  files downloaded: ${files.length} (${(total / 1024 / 1024).toFixed(1)} MB in total)`,
  );
  if (largest)
    console.log(`  largest: ${largest.title} (${(largest.bytes / 1024 / 1024).toFixed(1)} MB)`);
  const kept = items.filter((i) => i.kind === "link" && i.status === "ok");
  const fallbacks = kept.filter((i) => i.note?.startsWith("link to the original"));
  console.log(
    `  kept as links: ${kept.length} (${fallbacks.length} of them files that could not be taken)`,
  );
  for (const i of fallbacks) {
    console.log(
      `    - ${i.category} › ${i.title}: ${i.note.replace("link to the original: ", "")}`,
    );
  }
  console.log(`  failed: ${failed.length}`);
  for (const i of failed) console.log(`    - ${i.category} › ${i.title}: ${i.note}`);
  console.log(`  folders shared by several entries: ${sharedFolders.length}`);
  for (const f of sharedFolders) console.log(`    - ${f.url} (${f.uses} entries)`);
  console.log(`  unrelated links outside the content, not imported: ${spam.length}`);
  console.log(`\nManifest: ${path.relative(process.cwd(), MANIFEST)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
