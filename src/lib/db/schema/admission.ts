import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { programmes } from "./content";
import { contentStatus } from "./enums";
import { media } from "./media";

/*
 * The Admission for new students page (/admissions). Whether applications are upcoming, open or
 * closed follows the important dates (the step that opens applications and the one that closes
 * them), unless an administrator pins it.
 */

export const admissionStatus = pgEnum("admission_status", ["upcoming", "open", "closed"]);
export const admissionStepMark = pgEnum("admission_step_mark", ["opens", "closes"]);

const mediaRef = (name: string) => uuid(name).references(() => media.id, { onDelete: "set null" });
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Everything on the page that is said once: a single row (id 1). */
export const admissionSettings = pgTable(
  "admission_settings",
  {
    id: integer("id").primaryKey().default(1),
    /** e.g. "2026". */
    intake: varchar("intake", { length: 40 }).notNull(),
    /** Pins the page's state; null follows the dates. */
    statusOverride: admissionStatus("status_override"),
    /** Shown while admission is closed, e.g. "Expected March 2027, to be confirmed". */
    nextIntakeNote: varchar("next_intake_note", { length: 200 }),
    /** The online application form, linked while applications are open. */
    applyUrl: varchar("apply_url", { length: 500 }),
    intro: text("intro").notNull(),
    heroImageId: mediaRef("hero_image_id"),
    heroImageAlt: varchar("hero_image_alt", { length: 300 }),
    /** Eligibility: who can apply, in short (the full requirements are admission_tracks). */
    eligibilityChecklist: text("eligibility_checklist")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    labImageId: mediaRef("lab_image_id"),
    labImageAlt: varchar("lab_image_alt", { length: 300 }),
    labCaption: varchar("lab_caption", { length: 200 }),
    /** Documents: also shown on each bachelor's programme page. */
    documentsIntro: text("documents_intro"),
    documentsChecklist: text("documents_checklist")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    criteriaLabel: varchar("criteria_label", { length: 200 }),
    criteriaUrl: varchar("criteria_url", { length: 500 }),
    officeImageId: mediaRef("office_image_id"),
    officeImageAlt: varchar("office_image_alt", { length: 300 }),
    officeCaption: varchar("office_caption", { length: 200 }),
    /** The admissions office. */
    contactEmail: varchar("contact_email", { length: 254 }),
    contactPhone: varchar("contact_phone", { length: 40 }),
    contactHours: varchar("contact_hours", { length: 120 }),
    contactAddress: varchar("contact_address", { length: 300 }),
    ...timestamps(),
  },
  (t) => [check("admission_settings_single_row", sql`${t.id} = 1`)],
);

/**
 * The steps an intake goes through (Applications open, Online entrance test, …), offered when an
 * important date is added. One step may open applications, one close them.
 */
export const admissionStepTypes = pgTable(
  "admission_step_types",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 120 }).notNull().unique(),
    mark: admissionStepMark("mark"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
  },
  (t) => [uniqueIndex("admission_step_types_mark_unique").on(t.mark)],
);

/** The intake's important dates, in order of date: each a step, dated once. */
export const admissionSteps = pgTable(
  "admission_steps",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Each step is dated once; a step in use cannot be deleted. */
    stepTypeId: integer("step_type_id")
      .notNull()
      .unique()
      .references(() => admissionStepTypes.id, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    /** The same as the start for a one-day step. */
    endDate: date("end_date").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("admission_steps_date_idx").on(t.startDate),
    check("admission_steps_dates", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

/** A kind of programme's entry requirements, e.g. Architecture (aptitude test). */
export const admissionTracks = pgTable("admission_tracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 80 }).notNull(),
  /** The selection test, as shown on the programme cards, e.g. "Aptitude test". */
  testType: varchar("test_type", { length: 80 }).notNull(),
  /** Up to three tables: [{ title, rows: [{ label, value }] }]; the first is shown on its own. */
  groups: jsonb("groups")
    .$type<{ title: string; rows: { label: string; value: string }[] }[]>()
    .notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
});

/** The programmes that admit new students, each under its requirements. */
export const admissionProgrammes = pgTable("admission_programmes", {
  programmeId: integer("programme_id")
    .primaryKey()
    .references(() => programmes.id, { onDelete: "cascade" }),
  trackId: integer("track_id")
    .notNull()
    .references(() => admissionTracks.id, { onDelete: "cascade" }),
});

/** Questions and answers, in order. */
export const admissionFaqs = pgTable(
  "admission_faqs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    question: varchar("question", { length: 300 }).notNull(),
    /** Plain text, with {placeholders} filled in from the settings and the dates. */
    answer: text("answer").notNull(),
    linkLabel: varchar("link_label", { length: 120 }),
    /** A page of this site, a section of this page (#dates) or another website. */
    linkUrl: varchar("link_url", { length: 500 }),
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    ...timestamps(),
  },
  (t) => [index("admission_faqs_public_idx").on(t.status, t.sortOrder)],
);
