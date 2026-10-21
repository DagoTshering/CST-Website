import "server-only";

import { and, asc, eq, inArray, isNotNull, notInArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { Photo } from "@/content/home";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import { ActionError, type ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  checkedIds,
  lines,
  optionalLink,
  optionalDate,
  optionalMediaId,
  optionalText,
  optionalUrl,
  requiredDate,
  requiredText,
  status,
} from "../validation";
import { PROGRAMMES_TAG } from "./programmes";
import { asField, loadPreview, toPhoto } from "./shared";

/*
 * The Admission for new students page (/admissions): what it says once (the settings), the
 * intake's important dates, the entry requirements by kind of programme (with the programmes
 * each covers), and the questions and answers. Its state (upcoming, open, closed) is worked out
 * from the dates when the page is shown (src/lib/admission.ts).
 */

const {
  admissionFaqs,
  admissionProgrammes,
  admissionSettings,
  admissionStepTypes,
  admissionSteps,
  admissionTracks,
  media,
  programmes,
} = schema;

export const ADMISSION_TAG = "cms:admission";

const SETTINGS_ID = 1;

/** "" follows the dates. */
export const STATUS_CHOICES = [
  { value: "", label: "Follow the dates" },
  { value: "upcoming", label: "Upcoming (opening soon)" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const email = (label: string) =>
  optionalText(label, 254).pipe(z.union([z.null(), z.email("Enter a valid email address.")]));

/** An image's description is needed once there is an image (and dropped without one). */
const describedImages =
  <T extends Record<string, unknown>>(pairs: [keyof T, keyof T][]) =>
  (data: T, ctx: z.RefinementCtx) => {
    for (const [image, alt] of pairs) {
      if (data[image] && !data[alt]) {
        ctx.addIssue({
          code: "custom",
          path: [alt as string],
          message: "Describe the image for people who cannot see it.",
        });
      }
    }
  };

// ---------------------------------------------------------------------------- settings

const settingsSchema = z
  .object({
    intake: requiredText("Intake", 40),
    statusOverride: z
      .enum(["", "upcoming", "open", "closed"], { error: "Choose how the state is set." })
      .transform((value) => value || null),
    nextIntakeNote: optionalText("Next intake", 200),
    applyUrl: optionalUrl("Application form"),
    intro: requiredText("Introduction", 1000),
    heroImageId: optionalMediaId,
    heroImageAlt: optionalText("Image description", 300),
    eligibilityChecklist: lines("Who can apply", 12, 300),
    labImageId: optionalMediaId,
    labImageAlt: optionalText("Image description", 300),
    labCaption: optionalText("Caption", 200),
    documentsIntro: optionalText("Introduction", 1000),
    documentsChecklist: lines("Documents", 12, 200),
    criteriaLabel: optionalText("Link text", 200),
    criteriaUrl: optionalUrl("Link"),
    officeImageId: optionalMediaId,
    officeImageAlt: optionalText("Image description", 300),
    officeCaption: optionalText("Caption", 200),
    contactEmail: email("Email"),
    contactPhone: optionalText("Phone", 40).refine(
      (value) => value === null || /^[\d\s()+-]{6,}$/.test(value),
      "Enter a phone number, e.g. +975 5 252 207.",
    ),
    contactHours: optionalText("Office hours", 120),
    contactAddress: optionalText("Address", 300),
  })
  .superRefine(
    describedImages([
      ["heroImageId", "heroImageAlt"],
      ["labImageId", "labImageAlt"],
      ["officeImageId", "officeImageAlt"],
    ]),
  )
  .superRefine((data, ctx) => {
    if (data.statusOverride === "open" && !data.applyUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["applyUrl"],
        message: "Applications are set to open: add the application form's web address.",
      });
    }
    if (Boolean(data.criteriaLabel) !== Boolean(data.criteriaUrl)) {
      ctx.addIssue({
        code: "custom",
        path: [data.criteriaLabel ? "criteriaUrl" : "criteriaLabel"],
        message: "Give the link both its text and its web address, or neither.",
      });
    }
  })
  .transform((data) => ({
    ...data,
    heroImageAlt: data.heroImageId ? data.heroImageAlt : null,
    labImageAlt: data.labImageId ? data.labImageAlt : null,
    officeImageAlt: data.officeImageId ? data.officeImageAlt : null,
  }));

type SettingsInput = z.output<typeof settingsSchema>;

const oneLine = "One per line.";

export const settingsFields: FieldDef[] = [
  {
    kind: "heading",
    name: "intakeSection",
    label: "Intake and state",
    help: "The page shows applications as upcoming, open or closed from the important dates below: before the step that opens applications, until the step that closes them, and after.",
  },
  {
    kind: "text",
    name: "intake",
    label: "Intake",
    required: true,
    maxLength: 40,
    width: "half",
    placeholder: "2026",
  },
  {
    kind: "select",
    name: "statusOverride",
    label: "State",
    width: "half",
    options: STATUS_CHOICES,
    help: "Normally “Follow the dates”. Choose a state to pin it, e.g. to close applications early.",
  },
  {
    kind: "text",
    name: "applyUrl",
    label: "Application form",
    maxLength: 500,
    width: "half",
    placeholder: "https://forms.gle/…",
    help: "Linked from “Apply online” while applications are open.",
  },
  {
    kind: "text",
    name: "nextIntakeNote",
    label: "Next intake",
    maxLength: 200,
    width: "half",
    placeholder: "Expected March 2027, to be confirmed",
    help: "Shown while admission is closed.",
  },
  {
    kind: "textarea",
    name: "intro",
    label: "Introduction",
    required: true,
    maxLength: 1000,
    rows: 3,
  },
  { kind: "image", name: "heroImageId", altName: "heroImageAlt", label: "Photo at the top" },

  { kind: "heading", name: "eligibilitySection", label: "Eligibility" },
  {
    kind: "textarea",
    name: "eligibilityChecklist",
    label: "Who can apply",
    maxLength: 3800,
    rows: 4,
    help: `The short list beside the photo; the full requirements are below this form. ${oneLine}`,
  },
  { kind: "image", name: "labImageId", altName: "labImageAlt", label: "Photo" },
  { kind: "text", name: "labCaption", label: "Photo caption", maxLength: 200 },

  {
    kind: "heading",
    name: "documentsSection",
    label: "Documents",
    help: "The documents are also listed on each bachelor’s programme page, with a link to this page.",
  },
  { kind: "textarea", name: "documentsIntro", label: "Introduction", maxLength: 1000, rows: 2 },
  {
    kind: "textarea",
    name: "documentsChecklist",
    label: "Documents",
    maxLength: 2500,
    rows: 4,
    help: oneLine,
  },
  {
    kind: "text",
    name: "criteriaLabel",
    label: "Link text",
    maxLength: 200,
    width: "half",
    placeholder: "RUB admission criteria and tuition fees",
  },
  {
    kind: "text",
    name: "criteriaUrl",
    label: "Link",
    maxLength: 500,
    width: "half",
    placeholder: "https://www.rub.edu.bt/…",
  },
  { kind: "image", name: "officeImageId", altName: "officeImageAlt", label: "Photo" },
  { kind: "text", name: "officeCaption", label: "Photo caption", maxLength: 200 },

  { kind: "heading", name: "contactSection", label: "Admissions office" },
  { kind: "text", name: "contactEmail", label: "Email", maxLength: 254, width: "half" },
  {
    kind: "text",
    name: "contactPhone",
    label: "Phone",
    maxLength: 40,
    width: "half",
    placeholder: "+975 5 252 207",
  },
  {
    kind: "text",
    name: "contactHours",
    label: "Office hours",
    maxLength: 120,
    width: "half",
    placeholder: "Mon–Fri, 8:00 AM–4:00 PM",
  },
  { kind: "text", name: "contactAddress", label: "Address", maxLength: 300, width: "half" },
];

/** The settings are one record: saving creates it the first time and updates it after that. */
export const settingsResource: ResourceDef<SettingsInput> = {
  singular: "Admissions page",
  basePath: "/admin/admissions",
  tag: ADMISSION_TAG,
  schema: settingsSchema,
  media: (data) => [
    { field: "heroImageId", id: data.heroImageId, kind: "image" },
    { field: "labImageId", id: data.labImageId, kind: "image" },
    { field: "officeImageId", id: data.officeImageId, kind: "image" },
  ],
  create: async (tx, data) => {
    await tx
      .insert(admissionSettings)
      .values({ id: SETTINGS_ID, ...data })
      .onConflictDoUpdate({ target: admissionSettings.id, set: data });
  },
  update: async () => false, // never used: saving always goes through create (an upsert)
  remove: async () => false,
};

export async function getSettingsForm(): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(admissionSettings)
    .where(eq(admissionSettings.id, SETTINGS_ID))
    .limit(1);
  if (!row) return null;
  const [hero, lab, office] = await Promise.all([
    loadPreview(row.heroImageId),
    loadPreview(row.labImageId),
    loadPreview(row.officeImageId),
  ]);
  return {
    values: {
      intake: row.intake,
      statusOverride: row.statusOverride ?? "",
      nextIntakeNote: asField(row.nextIntakeNote),
      applyUrl: asField(row.applyUrl),
      intro: row.intro,
      heroImageId: asField(row.heroImageId),
      heroImageAlt: asField(row.heroImageAlt),
      eligibilityChecklist: row.eligibilityChecklist.join("\n"),
      labImageId: asField(row.labImageId),
      labImageAlt: asField(row.labImageAlt),
      labCaption: asField(row.labCaption),
      documentsIntro: asField(row.documentsIntro),
      documentsChecklist: row.documentsChecklist.join("\n"),
      criteriaLabel: asField(row.criteriaLabel),
      criteriaUrl: asField(row.criteriaUrl),
      officeImageId: asField(row.officeImageId),
      officeImageAlt: asField(row.officeImageAlt),
      officeCaption: asField(row.officeCaption),
      contactEmail: asField(row.contactEmail),
      contactPhone: asField(row.contactPhone),
      contactHours: asField(row.contactHours),
      contactAddress: asField(row.contactAddress),
    },
    media: { heroImageId: hero, labImageId: lab, officeImageId: office },
  };
}

// ---------------------------------------------------------------------------- steps

export const STEP_MARKS = [
  { value: "", label: "Neither" },
  { value: "opens", label: "Opens applications" },
  { value: "closes", label: "Closes applications" },
];

const stepTypeSchema = z.object({
  name: requiredText("Step", 120),
  mark: z
    .enum(["", "opens", "closes"], { error: "Choose what the step does." })
    .transform((value) => value || null),
});

type StepTypeInput = z.output<typeof stepTypeSchema>;

export const stepTypeFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Step",
    required: true,
    maxLength: 120,
    placeholder: "Online entrance test",
  },
  {
    kind: "select",
    name: "mark",
    label: "Application window",
    options: STEP_MARKS,
    help: "The page is “upcoming” before the date of the step that opens applications, “open” until the end of the date of the step that closes them, and “closed” after. One step of each.",
  },
];

export const stepTypeResource: ResourceDef<StepTypeInput> = {
  singular: "step",
  basePath: "/admin/admissions/steps",
  tag: ADMISSION_TAG,
  schema: stepTypeSchema,
  ordering: { key: "admissionStepTypes", group: () => "all" },
  validate: async (tx, data, id) => {
    const errors: Record<string, string[]> = {};
    const [named] = await tx
      .select({ id: admissionStepTypes.id })
      .from(admissionStepTypes)
      .where(eq(admissionStepTypes.name, data.name))
      .limit(1);
    if (named && named.id !== id) errors.name = ["There is already a step with this name."];
    if (data.mark) {
      const [other] = await tx
        .select({ id: admissionStepTypes.id, name: admissionStepTypes.name })
        .from(admissionStepTypes)
        .where(eq(admissionStepTypes.mark, data.mark))
        .limit(1);
      if (other && other.id !== id) {
        errors.mark = [
          `“${other.name}” already ${data.mark} applications. Change that step first.`,
        ];
      }
    }
    return Object.keys(errors).length > 0 ? errors : null;
  },
  create: async (tx, data) =>
    (await tx.insert(admissionStepTypes).values(data).returning({ id: admissionStepTypes.id }))[0]
      .id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(admissionStepTypes)
        .set(data)
        .where(eq(admissionStepTypes.id, id))
        .returning({ id: admissionStepTypes.id })
    ).length > 0,
  remove: async (tx, id) => {
    const [dated] = await tx
      .select({ id: admissionSteps.id })
      .from(admissionSteps)
      .where(eq(admissionSteps.stepTypeId, id))
      .limit(1);
    if (dated) {
      throw new ActionError(
        "This step has a date under Important dates. Delete that date first, then the step.",
      );
    }
    return (
      (
        await tx
          .delete(admissionStepTypes)
          .where(eq(admissionStepTypes.id, id))
          .returning({ id: admissionStepTypes.id })
      ).length > 0
    );
  },
};

/** The steps, in order, with the date each has (if any), for the Steps list. */
export async function listStepTypes() {
  await requireAdmin();
  return getDb()
    .select({
      id: admissionStepTypes.id,
      name: admissionStepTypes.name,
      mark: admissionStepTypes.mark,
      updatedAt: admissionStepTypes.updatedAt,
      startDate: admissionSteps.startDate,
      endDate: admissionSteps.endDate,
    })
    .from(admissionStepTypes)
    .leftJoin(admissionSteps, eq(admissionSteps.stepTypeId, admissionStepTypes.id))
    .orderBy(asc(admissionStepTypes.sortOrder), asc(admissionStepTypes.name));
}

export async function getStepTypeForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(admissionStepTypes)
    .where(eq(admissionStepTypes.id, id))
    .limit(1);
  return row ? { values: { name: row.name, mark: row.mark ?? "" }, media: {} } : null;
}

// ---------------------------------------------------------------------------- important dates

const stepSchema = z
  .object({
    stepTypeId: z
      .string()
      .regex(/^\d{1,9}$/, "Choose the step.")
      .transform(Number),
    startDate: requiredDate("Date"),
    endDate: optionalDate("Last day"),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    path: ["endDate"],
    message: "The last day cannot be before the first.",
  })
  .transform((data) => ({ ...data, endDate: data.endDate ?? data.startDate }));

type StepInput = z.output<typeof stepSchema>;

/** The date form: the step is chosen from the Steps list (those without a date, and its own). */
export function stepFields(steps: { id: number; name: string; mark: string | null }[]): FieldDef[] {
  const markNote = { opens: " (opens applications)", closes: " (closes applications)" };
  return [
    {
      kind: "select",
      name: "stepTypeId",
      label: "Step",
      required: true,
      options: steps.map((t) => ({
        value: String(t.id),
        label: `${t.name}${t.mark ? markNote[t.mark as keyof typeof markNote] : ""}`,
      })),
      help: "Missing a step? Add it under Steps (the button on the Admissions screen).",
    },
    { kind: "date", name: "startDate", label: "Date", required: true, width: "half" },
    {
      kind: "date",
      name: "endDate",
      label: "Last day",
      width: "half",
      help: "Only for a step of more than one day.",
    },
  ];
}

/** The steps a date form offers: those without a date yet, plus the date's own. */
export async function listStepChoices(forStepId: number | null) {
  await requireAdmin();
  const rows = await getDb()
    .select({
      id: admissionStepTypes.id,
      name: admissionStepTypes.name,
      mark: admissionStepTypes.mark,
      datedBy: admissionSteps.id,
    })
    .from(admissionStepTypes)
    .leftJoin(admissionSteps, eq(admissionSteps.stepTypeId, admissionStepTypes.id))
    .orderBy(asc(admissionStepTypes.sortOrder), asc(admissionStepTypes.name));
  return rows.filter((r) => r.datedBy === null || r.datedBy === forStepId);
}

export const stepResource: ResourceDef<StepInput> = {
  singular: "date",
  basePath: "/admin/admissions",
  tag: ADMISSION_TAG,
  schema: stepSchema,
  validate: async (tx, data, id) => {
    const [type] = await tx
      .select({ id: admissionStepTypes.id, name: admissionStepTypes.name })
      .from(admissionStepTypes)
      .where(eq(admissionStepTypes.id, data.stepTypeId))
      .limit(1);
    if (!type) return { stepTypeId: ["That step no longer exists. Choose another."] };
    const [dated] = await tx
      .select({ id: admissionSteps.id })
      .from(admissionSteps)
      .where(eq(admissionSteps.stepTypeId, data.stepTypeId))
      .limit(1);
    if (dated && dated.id !== id) {
      return { stepTypeId: [`“${type.name}” already has a date. Edit that date instead.`] };
    }
    return null;
  },
  create: async (tx, data) =>
    (await tx.insert(admissionSteps).values(data).returning({ id: admissionSteps.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(admissionSteps)
        .set(data)
        .where(eq(admissionSteps.id, id))
        .returning({ id: admissionSteps.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(admissionSteps)
        .where(eq(admissionSteps.id, id))
        .returning({ id: admissionSteps.id })
    ).length > 0,
};

export async function getStepForm(id: number): Promise<(FormInitial & { name: string }) | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select({
      stepTypeId: admissionSteps.stepTypeId,
      startDate: admissionSteps.startDate,
      endDate: admissionSteps.endDate,
      name: admissionStepTypes.name,
    })
    .from(admissionSteps)
    .innerJoin(admissionStepTypes, eq(admissionStepTypes.id, admissionSteps.stepTypeId))
    .where(eq(admissionSteps.id, id))
    .limit(1);
  if (!row) return null;
  return {
    name: row.name,
    values: {
      stepTypeId: String(row.stepTypeId),
      startDate: row.startDate,
      endDate: row.endDate === row.startDate ? "" : row.endDate,
    },
    media: {},
  };
}

/** The dates with their steps' names and marks, in order of date. */
const datedSteps = () =>
  getDb()
    .select({
      id: admissionSteps.id,
      title: admissionStepTypes.name,
      mark: admissionStepTypes.mark,
      startDate: admissionSteps.startDate,
      endDate: admissionSteps.endDate,
    })
    .from(admissionSteps)
    .innerJoin(admissionStepTypes, eq(admissionStepTypes.id, admissionSteps.stepTypeId))
    .orderBy(
      asc(admissionSteps.startDate),
      asc(admissionStepTypes.sortOrder),
      asc(admissionSteps.id),
    );

// ---------------------------------------------------------------------------- requirements

/** "Physics: 50%" lines as table rows. */
const tableRows = (label: string) =>
  lines(label, 20, 200).superRefine((rows, ctx) => {
    const bad = rows.find((row) => !/^[^:]+:\s*\S/.test(row));
    if (bad) {
      ctx.addIssue({
        code: "custom",
        message: `Write each row as “Requirement: value”, e.g. “Physics: 50%” (not “${bad}”).`,
      });
    }
  });

const toRows = (rows: string[]) =>
  rows.map((row) => {
    const at = row.indexOf(":");
    return { label: row.slice(0, at).trim(), value: row.slice(at + 1).trim() };
  });

const trackSchema = z
  .object({
    title: requiredText("Name", 80),
    testType: requiredText("Selection test", 80),
    programmeIds: checkedIds,
    group1Title: requiredText("Table title", 120),
    group1Rows: tableRows("Rows"),
    group2Title: optionalText("Table title", 120),
    group2Rows: tableRows("Rows"),
    group3Title: optionalText("Table title", 120),
    group3Rows: tableRows("Rows"),
  })
  .superRefine((data, ctx) => {
    if (data.group1Rows.length === 0) {
      ctx.addIssue({ code: "custom", path: ["group1Rows"], message: "Add at least one row." });
    }
    for (const n of [2, 3] as const) {
      const title = data[`group${n}Title`];
      const rows = data[`group${n}Rows`];
      if (Boolean(title) !== rows.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: [title ? `group${n}Rows` : `group${n}Title`],
          message: title ? "Add its rows, or clear the title." : "Give the table a title.",
        });
      }
    }
  })
  .transform(({ title, testType, programmeIds, ...g }) => ({
    title,
    testType,
    programmeIds,
    groups: (
      [
        [g.group1Title, g.group1Rows],
        [g.group2Title, g.group2Rows],
        [g.group3Title, g.group3Rows],
      ] as const
    )
      .filter(([groupTitle, rows]) => groupTitle && rows.length > 0)
      .map(([groupTitle, rows]) => ({ title: groupTitle!, rows: toRows(rows) })),
  }));

type TrackInput = z.output<typeof trackSchema>;

/** The undergraduate programmes, as the track form's checkboxes. */
export async function listAdmissionProgrammeChoices() {
  await requireAdmin();
  return getDb()
    .select({ id: programmes.id, name: programmes.name, shortName: programmes.shortName })
    .from(programmes)
    .where(eq(programmes.level, "undergraduate"))
    .orderBy(asc(programmes.sortOrder), asc(programmes.name));
}

export function trackFields(choices: { id: number; name: string; shortName: string | null }[]) {
  const rowsHelp = "One row per line, as “Requirement: value”, e.g. “Physics: 50%”.";
  return [
    {
      kind: "text",
      name: "title",
      label: "Name",
      required: true,
      maxLength: 80,
      width: "half",
      placeholder: "Engineering",
    },
    {
      kind: "text",
      name: "testType",
      label: "Selection test",
      required: true,
      maxLength: 80,
      width: "half",
      placeholder: "Entrance test",
      help: "Shown on the programme cards.",
    },
    {
      kind: "checkboxes",
      name: "programmeIds",
      label: "Programmes",
      columns: 2,
      options: choices.map((p) => ({ value: String(p.id), label: p.shortName ?? p.name })),
      help: "The undergraduate programmes these requirements apply to; they are the programmes listed on the page. A programme belongs to one kind: ticking it here moves it from another.",
    },
    {
      kind: "heading",
      name: "table1",
      label: "First table",
      help: "Shown on its own, on the left on a wide screen.",
    },
    {
      kind: "text",
      name: "group1Title",
      label: "Title",
      required: true,
      maxLength: 120,
      placeholder: "Minimum marks in Class XII",
    },
    {
      kind: "textarea",
      name: "group1Rows",
      label: "Rows",
      maxLength: 4000,
      rows: 5,
      help: rowsHelp,
    },
    {
      kind: "heading",
      name: "table2",
      label: "More tables",
      help: "Optional. Shown together, on the right on a wide screen.",
    },
    { kind: "text", name: "group2Title", label: "Title", maxLength: 120, placeholder: "Selection" },
    {
      kind: "textarea",
      name: "group2Rows",
      label: "Rows",
      maxLength: 4000,
      rows: 3,
      help: rowsHelp,
    },
    {
      kind: "text",
      name: "group3Title",
      label: "Title",
      maxLength: 120,
      placeholder: "Ability ratings",
    },
    {
      kind: "textarea",
      name: "group3Rows",
      label: "Rows",
      maxLength: 4000,
      rows: 5,
      help: rowsHelp,
    },
  ] satisfies FieldDef[] as FieldDef[];
}

/** Moves the chosen programmes under this track; those it no longer lists are left without one. */
async function assignProgrammes(
  tx: Parameters<ResourceDef<TrackInput>["create"]>[0],
  trackId: number,
  ids: number[],
) {
  if (ids.length > 0) {
    const found = await tx
      .select({ id: programmes.id })
      .from(programmes)
      .where(and(inArray(programmes.id, ids), eq(programmes.level, "undergraduate")));
    if (found.length !== ids.length) {
      throw new ActionError(
        "A programme you chose no longer exists or is not undergraduate. Reload the page.",
      );
    }
  }
  await tx
    .delete(admissionProgrammes)
    .where(
      ids.length > 0
        ? and(
            eq(admissionProgrammes.trackId, trackId),
            notInArray(admissionProgrammes.programmeId, ids),
          )
        : eq(admissionProgrammes.trackId, trackId),
    );
  for (const programmeId of ids) {
    await tx
      .insert(admissionProgrammes)
      .values({ programmeId, trackId })
      .onConflictDoUpdate({ target: admissionProgrammes.programmeId, set: { trackId } });
  }
}

export const trackResource: ResourceDef<TrackInput> = {
  singular: "requirements",
  basePath: "/admin/admissions",
  tag: ADMISSION_TAG,
  schema: trackSchema,
  ordering: { key: "admissionTracks", group: () => "all" },
  create: async (tx, { programmeIds, ...data }) => {
    const [{ id }] = await tx
      .insert(admissionTracks)
      .values(data)
      .returning({ id: admissionTracks.id });
    await assignProgrammes(tx, id, programmeIds);
    return id;
  },
  update: async (tx, id, { programmeIds, ...data }) => {
    const found =
      (
        await tx
          .update(admissionTracks)
          .set(data)
          .where(eq(admissionTracks.id, id))
          .returning({ id: admissionTracks.id })
      ).length > 0;
    if (found) await assignProgrammes(tx, id, programmeIds);
    return found;
  },
  // its programmes are unassigned with it (admission_programmes cascades)
  remove: async (tx, id) =>
    (
      await tx
        .delete(admissionTracks)
        .where(eq(admissionTracks.id, id))
        .returning({ id: admissionTracks.id })
    ).length > 0,
};

export async function getTrackForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select().from(admissionTracks).where(eq(admissionTracks.id, id)).limit(1);
  if (!row) return null;
  const assigned = await db
    .select({ id: admissionProgrammes.programmeId })
    .from(admissionProgrammes)
    .where(eq(admissionProgrammes.trackId, id));
  const group = (i: number) => row.groups[i];
  const rows = (i: number) =>
    group(i)
      ?.rows.map((r) => `${r.label}: ${r.value}`)
      .join("\n") ?? "";
  return {
    values: {
      title: row.title,
      testType: row.testType,
      programmeIds: assigned.map((p) => String(p.id)).join(","),
      group1Title: group(0)?.title ?? "",
      group1Rows: rows(0),
      group2Title: group(1)?.title ?? "",
      group2Rows: rows(1),
      group3Title: group(2)?.title ?? "",
      group3Rows: rows(2),
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- questions

const faqSchema = z
  .object({
    question: requiredText("Question", 300),
    answer: requiredText("Answer", 3000),
    linkLabel: optionalText("Link text", 120),
    linkUrl: optionalLink("Link"),
    status,
  })
  .refine((data) => Boolean(data.linkLabel) === Boolean(data.linkUrl), {
    path: ["linkUrl"],
    message: "Give the link both its text and where it goes, or neither.",
  });

type FaqInput = z.output<typeof faqSchema>;

export const faqFields: FieldDef[] = [
  { kind: "text", name: "question", label: "Question", required: true, maxLength: 300 },
  {
    kind: "textarea",
    name: "answer",
    label: "Answer",
    required: true,
    maxLength: 3000,
    rows: 4,
    help: "Plain text. These are filled in on the page: {email}, {phone} and {hours} (the admissions office), {intake}, {nextIntake}, and {applyWindow}, a sentence about when to apply that follows the dates and the page’s state.",
  },
  {
    kind: "text",
    name: "linkLabel",
    label: "Link text",
    maxLength: 120,
    width: "half",
    placeholder: "See the important dates",
  },
  {
    kind: "text",
    name: "linkUrl",
    label: "Link",
    maxLength: 500,
    width: "half",
    placeholder: "#dates",
    help: "A section of the page (#dates, #eligibility, #documents, #contact), a page such as /programmes, or a web address.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const faqResource: ResourceDef<FaqInput> = {
  singular: "question",
  basePath: "/admin/admissions",
  tag: ADMISSION_TAG,
  schema: faqSchema,
  ordering: { key: "admissionFaqs", group: () => "all" },
  create: async (tx, data) =>
    (await tx.insert(admissionFaqs).values(data).returning({ id: admissionFaqs.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(admissionFaqs)
        .set(data)
        .where(eq(admissionFaqs.id, id))
        .returning({ id: admissionFaqs.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(admissionFaqs)
        .where(eq(admissionFaqs.id, id))
        .returning({ id: admissionFaqs.id })
    ).length > 0,
};

export async function getFaqForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(admissionFaqs).where(eq(admissionFaqs.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      question: row.question,
      answer: row.answer,
      linkLabel: asField(row.linkLabel),
      linkUrl: asField(row.linkUrl),
      status: row.status,
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- admin lists

/** The dates, requirements and questions for the Admissions screen. */
export async function listAdmissionParts() {
  await requireAdmin();
  const db = getDb();
  const [steps, tracks, assigned, faqs] = await Promise.all([
    datedSteps(),
    db
      .select()
      .from(admissionTracks)
      .orderBy(asc(admissionTracks.sortOrder), asc(admissionTracks.id)),
    db
      .select({
        trackId: admissionProgrammes.trackId,
        name: programmes.name,
        shortName: programmes.shortName,
      })
      .from(admissionProgrammes)
      .innerJoin(programmes, eq(programmes.id, admissionProgrammes.programmeId))
      .orderBy(asc(programmes.sortOrder)),
    db.select().from(admissionFaqs).orderBy(asc(admissionFaqs.sortOrder), asc(admissionFaqs.id)),
  ]);
  return {
    steps,
    tracks: tracks.map((t) => ({
      ...t,
      programmes: assigned.filter((a) => a.trackId === t.id).map((a) => a.shortName ?? a.name),
    })),
    faqs,
  };
}

// ---------------------------------------------------------------------------- public

/** Everything the page shows but its state, or null before the settings are written. */
export async function getAdmissionPage() {
  "use cache";
  // the programmes listed come from Academic Programmes
  cacheTag(ADMISSION_TAG, PROGRAMMES_TAG);
  cacheLife("hours");

  const db = getDb();
  const [settings] = await db
    .select()
    .from(admissionSettings)
    .where(eq(admissionSettings.id, SETTINGS_ID))
    .limit(1);
  if (!settings) return null;

  const [steps, tracks, listed, faqs] = await Promise.all([
    datedSteps(),
    db
      .select()
      .from(admissionTracks)
      .orderBy(asc(admissionTracks.sortOrder), asc(admissionTracks.id)),
    // only programmes with a published page of their own, which the cards link to
    db
      .select({
        trackId: admissionProgrammes.trackId,
        slug: programmes.slug,
        name: programmes.name,
        shortName: programmes.shortName,
      })
      .from(admissionProgrammes)
      .innerJoin(programmes, eq(programmes.id, admissionProgrammes.programmeId))
      .where(and(eq(programmes.status, "published"), isNotNull(programmes.slug)))
      .orderBy(asc(programmes.sortOrder), asc(programmes.name)),
    db
      .select()
      .from(admissionFaqs)
      .where(eq(admissionFaqs.status, "published"))
      .orderBy(asc(admissionFaqs.sortOrder), asc(admissionFaqs.id)),
  ]);

  const imageIds = [settings.heroImageId, settings.labImageId, settings.officeImageId].filter(
    (id): id is string => Boolean(id),
  );
  const images = imageIds.length
    ? await db
        .select({
          id: media.id,
          storageKey: media.storageKey,
          width: media.width,
          height: media.height,
        })
        .from(media)
        .where(inArray(media.id, imageIds))
    : [];
  const photo = (id: string | null, alt: string | null): Photo | null => {
    const image = id ? images.find((i) => i.id === id) : undefined;
    return image ? toPhoto(image, alt) : null;
  };

  const testTypeOf = new Map(tracks.map((t) => [t.id, t.testType]));
  return {
    intake: settings.intake,
    statusOverride: settings.statusOverride,
    nextIntakeNote: settings.nextIntakeNote,
    applyUrl: settings.applyUrl,
    intro: settings.intro,
    heroPhoto: photo(settings.heroImageId, settings.heroImageAlt),
    steps: steps.map((s) => ({ title: s.title, start: s.startDate, end: s.endDate, mark: s.mark })),
    programmes: listed.map((p) => ({
      slug: p.slug!,
      name: p.shortName ?? p.name,
      testType: testTypeOf.get(p.trackId) ?? "",
    })),
    eligibility: {
      checklist: settings.eligibilityChecklist,
      photo: photo(settings.labImageId, settings.labImageAlt),
      caption: settings.labCaption,
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        groups: t.groups,
        programmes: listed.filter((p) => p.trackId === t.id).map((p) => p.shortName ?? p.name),
      })),
    },
    documents: {
      intro: settings.documentsIntro,
      checklist: settings.documentsChecklist,
      criteria:
        settings.criteriaLabel && settings.criteriaUrl
          ? { label: settings.criteriaLabel, href: settings.criteriaUrl }
          : null,
      photo: photo(settings.officeImageId, settings.officeImageAlt),
      caption: settings.officeCaption,
    },
    faqs: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      link: f.linkLabel && f.linkUrl ? { label: f.linkLabel, href: f.linkUrl } : null,
    })),
    contact: {
      email: settings.contactEmail,
      phone: settings.contactPhone,
      hours: settings.contactHours,
      address: settings.contactAddress,
    },
  };
}

export type AdmissionPage = NonNullable<Awaited<ReturnType<typeof getAdmissionPage>>>;

export type AdmissionDocuments = { requiredDocuments: string; admissionUrl: string } | null;

/** For each bachelor's programme page: the documents to bring, and where to read more. */
export async function getAdmissionDocuments(): Promise<AdmissionDocuments> {
  "use cache";
  cacheTag(ADMISSION_TAG);
  cacheLife("hours");

  const [row] = await getDb()
    .select({ checklist: admissionSettings.documentsChecklist })
    .from(admissionSettings)
    .where(eq(admissionSettings.id, SETTINGS_ID))
    .limit(1);
  if (!row || row.checklist.length === 0) return null;
  return {
    requiredDocuments: `${new Intl.ListFormat("en-GB").format(row.checklist)}.`,
    admissionUrl: "/admissions",
  };
}
