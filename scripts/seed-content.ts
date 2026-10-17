/**
 * The homepage's initial content: About CST, Facilities, Academic Programmes and the featured
 * leadership profile, as on the site before the admin panel. Events and announcements change
 * often and are left for administrators to add.
 *
 * Each category is seeded only while its table is empty, so rerunning the seed never overwrites
 * or duplicates content edited in the admin panel. Photographs are copied from public/images into
 * the upload store (UPLOAD_DIR) and recorded in `media`, as if they had been uploaded.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import sharp from "sharp";

import { hero } from "../src/content/home";
import type { getDb, schema as Schema } from "../src/lib/db";
import { uploadDir } from "../src/lib/media/paths";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const about = {
  heading: "Bhutan’s premier institute for engineering education",
  emphasis: "engineering",
  subtitle: "Royal University of Bhutan · Rinchending",
  body: [
    "The nation’s leading institution offers internationally recognised bachelor’s and master’s degrees in various engineering fields. With over two decades of experience, CST has been shaping the future of engineering with a strong emphasis on hands-on learning, innovative research, and industry collaboration.",
    "CST currently offers master’s programmes in Renewable Energy and Construction Management, providing advanced education and research opportunities for aspiring engineers.",
  ].join("\n\n"),
  image: "/images/home/campus-aerial-view.jpg",
  imageAlt:
    "The CST campus from the air: teaching blocks, hostels and the football ground on the hillside at Rinchending",
  caption: "Rinchending campus, from the air",
};

// NEEDS REVIEW: these descriptions come from the old page's template and have not been
// confirmed by the college (for example the 24-hour library access and the archery range).
const facilities = [
  {
    name: "Library & reading rooms",
    description:
      "Print and digital collections, group study rooms, and 24-hour access during examination weeks.",
    image: "/images/home/library-study.jpg",
    imageAlt: "Two students working on laptops in the library",
  },
  {
    name: "Laboratories & workshops",
    description:
      "Materials testing, surveying, electronics, fabrication and computing labs, supervised by lab technicians.",
    image: "/images/home/laboratory-workshop.jpg",
    imageAlt: "Students working at a process-control rig in a laboratory",
  },
  {
    name: "Hostels & dining",
    description:
      "Residential blocks for men and women, a central mess, and a booking desk for visiting students.",
    image: "/images/home/residential-blocks.jpg",
    imageAlt: "Residential blocks on campus at dusk",
  },
  {
    name: "Sports & recreation",
    description:
      "Football ground, indoor courts, an archery range and a gym, with inter-department leagues each semester.",
    image: "/images/home/indoor-basketball.jpg",
    imageAlt: "Students playing basketball on the indoor court",
  },
  {
    name: "Research centres",
    description:
      "Applied groups working on hydropower, renewable energy, road safety and construction materials.",
    image: "/images/home/international-conference.jpg",
    imageAlt:
      "Two speakers presenting at an international science and engineering conference at CST",
  },
  {
    name: "Health & student support",
    description:
      "A campus clinic, counselling appointments, and a student services desk for accommodation and finance.",
    image: "/images/home/health-awareness-day.jpg",
    imageAlt: "Students gathered for a health awareness day on campus",
  },
];

const president = {
  name: "Dr. Tshewang Lhendup",
  designation: "President, College of Science and Technology",
  // A low-resolution crop from the old site; replace it in the admin panel.
  image: "/images/temp/president-portrait.jpg",
  imageAlt: "Portrait of Dr. Tshewang Lhendup, President of CST",
};

const FORMATS = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
} as const;

export async function seedContent(db: Db, schema: typeof Schema) {
  /** Files copied for the category being seeded, removed again if its transaction fails. */
  let written: string[] = [];

  /** Copies an image from public/ into the upload store and records it; returns its id. */
  async function addImage(tx: Tx, publicPath: string) {
    const data = await readFile(path.join(process.cwd(), "public", publicPath));
    const meta = await sharp(data).metadata();
    const format = FORMATS[meta.format as keyof typeof FORMATS];
    if (!format) throw new Error(`${publicPath} is not a JPEG, PNG or WebP image`);

    const storageKey = `${randomUUID()}.${format.extension}`;
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(path.join(uploadDir(), storageKey), data, { flag: "wx", mode: 0o640 });
    written.push(storageKey);

    const [row] = await tx
      .insert(schema.media)
      .values({
        kind: "image",
        storageKey,
        originalName: path.basename(publicPath),
        mimeType: format.mimeType,
        byteSize: data.length,
        width: meta.width ?? null,
        height: meta.height ?? null,
      })
      .returning({ id: schema.media.id });
    return row.id;
  }

  /** Runs `seed` in a transaction if `table` is empty; reports what happened. */
  async function seedIfEmpty(label: string, table: PgTable, seed: (tx: Tx) => Promise<number>) {
    const [{ n }] = await db.select({ n: count() }).from(table);
    if (n > 0) {
      console.log(`${label}: already has content; left unchanged.`);
      return;
    }
    written = [];
    try {
      const created = await db.transaction(seed);
      console.log(`${label}: seeded ${created}.`);
    } catch (error) {
      // The transaction rolled back; remove the files it had copied.
      await Promise.all(written.map((key) => unlink(path.join(uploadDir(), key)).catch(() => {})));
      throw error;
    }
  }

  await seedIfEmpty("About CST", schema.aboutSection, async (tx) => {
    const { image, ...text } = about;
    await tx
      .insert(schema.aboutSection)
      .values({ ...text, imageId: await addImage(tx, image), status: "published" });
    return 1;
  });

  await seedIfEmpty("Facilities", schema.facilities, async (tx) => {
    for (const [i, { image, ...facility }] of facilities.entries()) {
      await tx.insert(schema.facilities).values({
        ...facility,
        imageId: await addImage(tx, image),
        sortOrder: (i + 1) * 10,
        status: "published",
      });
    }
    return facilities.length;
  });

  // The programmes as listed round the hero's clock, in the order they were first offered.
  await seedIfEmpty("Academic Programmes", schema.programmes, async (tx) => {
    await tx.insert(schema.programmes).values(
      hero.programmes.map((programme, i) => ({
        name: programme.title,
        level: programme.postgraduate ? ("postgraduate" as const) : ("undergraduate" as const),
        startYear: programme.year,
        sortOrder: (i + 1) * 10,
        status: "published" as const,
      })),
    );
    return hero.programmes.length;
  });

  await seedIfEmpty("Leadership & Governance", schema.leaders, async (tx) => {
    const { image, imageAlt, ...person } = president;
    await tx.insert(schema.leaders).values({
      ...person,
      portraitId: await addImage(tx, image),
      portraitAlt: imageAlt,
      sortOrder: 10,
      status: "published",
    });
    return 1;
  });
}
