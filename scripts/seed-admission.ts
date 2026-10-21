/**
 * Fills in the Admission for new students page (/admissions) from data/admission.json, the
 * content the static page was built from.
 *
 * - The page's settings (intake, introduction, checklists, contact, photos) are added while there
 *   are none; the photos are copied from public/images/admission into the upload store.
 * - The steps of the intake (with the ones that open and close applications), their dates, the
 *   entry requirements (with the programmes each covers, found by their page address) and the
 *   questions are each added while there are none.
 * - Nothing an administrator has written or changed is replaced.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { count, inArray } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";
import { imageCopier } from "./seed-images";

type Db = ReturnType<typeof getDb>;

type Photo = { image: string; alt: string; caption: string | null };

type AdmissionData = {
  intake: string;
  nextIntakeNote: string;
  applyUrl: string;
  intro: string;
  steps: { title: string; start: string; end: string; mark: "opens" | "closes" | null }[];
  tracks: {
    title: string;
    testType: string;
    programmes: string[];
    groups: { title: string; rows: { label: string; value: string }[] }[];
  }[];
  eligibilityChecklist: string[];
  documents: { intro: string; checklist: string[]; criteria: { label: string; url: string } };
  faq: { question: string; answer: string; link: { label: string; href: string } | null }[];
  contact: { email: string; phone: string; hours: string; address: string };
  photos: { hero: Photo; lab: Photo; office: Photo };
};

export async function seedAdmission(db: Db, schema: typeof Schema) {
  const {
    admissionFaqs,
    admissionProgrammes,
    admissionSettings,
    admissionStepTypes,
    admissionSteps,
    admissionTracks,
  } = schema;
  const data = JSON.parse(
    await readFile(path.join(process.cwd(), "data/admission.json"), "utf8"),
  ) as AdmissionData;
  const isEmpty = async (
    table:
      | typeof admissionSettings
      | typeof admissionSteps
      | typeof admissionStepTypes
      | typeof admissionTracks
      | typeof admissionFaqs,
  ) => (await db.select({ n: count() }).from(table))[0].n === 0;

  // ---------------------------------------------------------------- settings and photos
  if (await isEmpty(admissionSettings)) {
    const images = imageCopier(schema);
    try {
      await db.transaction(async (tx) => {
        const { hero, lab, office } = data.photos;
        await tx.insert(admissionSettings).values({
          intake: data.intake,
          nextIntakeNote: data.nextIntakeNote,
          applyUrl: data.applyUrl,
          intro: data.intro,
          heroImageId: await images.copy(tx, hero.image),
          heroImageAlt: hero.alt,
          eligibilityChecklist: data.eligibilityChecklist,
          labImageId: await images.copy(tx, lab.image),
          labImageAlt: lab.alt,
          labCaption: lab.caption,
          documentsIntro: data.documents.intro,
          documentsChecklist: data.documents.checklist,
          criteriaLabel: data.documents.criteria.label,
          criteriaUrl: data.documents.criteria.url,
          officeImageId: await images.copy(tx, office.image),
          officeImageAlt: office.alt,
          officeCaption: office.caption,
          contactEmail: data.contact.email,
          contactPhone: data.contact.phone,
          contactHours: data.contact.hours,
          contactAddress: data.contact.address,
        });
      });
      console.log("Admissions page: seeded.");
    } catch (error) {
      await images.discard(); // the transaction rolled back; remove the copied photos
      throw error;
    }
  } else {
    console.log("Admissions page: already has content; left unchanged.");
  }

  // ---------------------------------------------------------------- steps, then their dates
  if (await isEmpty(admissionStepTypes)) {
    await db
      .insert(admissionStepTypes)
      .values(data.steps.map((s, i) => ({ name: s.title, mark: s.mark, sortOrder: (i + 1) * 10 })));
    console.log(`Admissions steps: seeded ${data.steps.length}.`);
  }
  if (await isEmpty(admissionSteps)) {
    const types = await db
      .select({ id: admissionStepTypes.id, name: admissionStepTypes.name })
      .from(admissionStepTypes);
    const idOf = new Map(types.map((t) => [t.name, t.id]));
    const dated = data.steps.filter((s) => idOf.has(s.title));
    await db
      .insert(admissionSteps)
      .values(
        dated.map((s) => ({ stepTypeId: idOf.get(s.title)!, startDate: s.start, endDate: s.end })),
      );
    console.log(`Admissions dates: seeded ${dated.length}.`);
  }

  // ---------------------------------------------------------------- requirements
  if (await isEmpty(admissionTracks)) {
    const slugs = data.tracks.flatMap((t) => t.programmes);
    const found = await db
      .select({ id: schema.programmes.id, slug: schema.programmes.slug })
      .from(schema.programmes)
      .where(inArray(schema.programmes.slug, slugs));
    const idOf = new Map(found.map((p) => [p.slug, p.id]));
    const missing = slugs.filter((slug) => !idOf.has(slug));

    await db.transaction(async (tx) => {
      for (const [i, track] of data.tracks.entries()) {
        const [{ id }] = await tx
          .insert(admissionTracks)
          .values({
            title: track.title,
            testType: track.testType,
            groups: track.groups,
            sortOrder: (i + 1) * 10,
          })
          .returning({ id: admissionTracks.id });
        const programmeIds = track.programmes.flatMap((slug) => idOf.get(slug) ?? []);
        if (programmeIds.length > 0) {
          await tx
            .insert(admissionProgrammes)
            .values(programmeIds.map((programmeId) => ({ programmeId, trackId: id })))
            .onConflictDoNothing();
        }
      }
    });
    console.log(
      `Admissions requirements: seeded ${data.tracks.length}.` +
        (missing.length ? ` No programme page for: ${missing.join(", ")}.` : ""),
    );
  }

  // ---------------------------------------------------------------- questions
  if (await isEmpty(admissionFaqs)) {
    await db.insert(admissionFaqs).values(
      data.faq.map((f, i) => ({
        question: f.question,
        answer: f.answer,
        linkLabel: f.link?.label ?? null,
        linkUrl: f.link?.href ?? null,
        sortOrder: (i + 1) * 10,
        status: "published" as const,
      })),
    );
    console.log(`Admissions questions: seeded ${data.faq.length}.`);
  }
}
