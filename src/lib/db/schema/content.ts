import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { contentStatus, programmeLevel } from "./enums";
import { media } from "./media";
import { departments } from "./people";

/*
 * Website content managed in the admin panel. Every table has a draft/published status; the
 * public site only ever reads published rows.
 */

const status = () => contentStatus("status").notNull().default("draft");
const sortOrder = () => integer("sort_order").notNull().default(0);
const mediaRef = (name: string) => uuid(name).references(() => media.id, { onDelete: "set null" });
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** The homepage's About CST section: a single row (id 1). */
export const aboutSection = pgTable(
  "about_section",
  {
    id: integer("id").primaryKey().default(1),
    heading: varchar("heading", { length: 200 }).notNull(),
    /** A word or phrase of the heading set in colour, with the gold underline. */
    emphasis: varchar("emphasis", { length: 80 }),
    subtitle: varchar("subtitle", { length: 200 }),
    /** Plain text; paragraphs are separated by a blank line. */
    body: text("body").notNull(),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    caption: varchar("caption", { length: 200 }),
    status: status(),
    ...timestamps(),
  },
  (t) => [check("about_section_single_row", sql`${t.id} = 1`)],
);

export const facilities = pgTable(
  "facilities",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    sortOrder: sortOrder(),
    status: status(),
    ...timestamps(),
  },
  (t) => [index("facilities_public_idx").on(t.status, t.sortOrder)],
);

export const programmes = pgTable(
  "programmes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** The full title, e.g. "Bachelor of Engineering in Civil Engineering". */
    name: varchar("name", { length: 200 }).notNull(),
    level: programmeLevel("level").notNull(),
    /** The summary, at the top of the programme's page and in the listing. */
    shortDescription: text("short_description"),
    /** Year the programme was first offered. */
    startYear: smallint("start_year"),
    /** Its month (1–12), when known: "Since July 2014". */
    startMonth: smallint("start_month"),
    /** The programme's page is /programmes/<slug>. Without one, it has no page. */
    slug: varchar("slug", { length: 80 }).unique(),
    /** The name on its page and in the listing, e.g. "Civil Engineering". */
    shortName: varchar("short_name", { length: 120 }),
    /** e.g. "Bachelor of Engineering". */
    degree: varchar("degree", { length: 160 }),
    /** e.g. "4 years", "18 months". */
    duration: varchar("duration", { length: 40 }),
    /** The department that runs it; none for a college-level programme. */
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    /** The department's web page about it (shown only while it has a department). */
    websiteUrl: varchar("website_url", { length: 500 }),
    /** The programme document: a link (e.g. Google Drive), an uploaded PDF, or both. */
    documentUrl: varchar("document_url", { length: 500 }),
    documentFileId: mediaRef("document_file_id"),
    outcomes: text("outcomes")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    requirements: text("requirements")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** How applicants are selected, when the programme says. */
    selectionNote: text("selection_note"),
    careers: text("careers")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Shown above and below the modules (see programme_modules). */
    structureIntro: text("structure_intro"),
    structureNote: text("structure_note"),
    /** Up to three photos for the page's collage: imageId first. */
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    image2Id: mediaRef("image2_id"),
    image3Id: mediaRef("image3_id"),
    sortOrder: sortOrder(),
    status: status(),
    ...timestamps(),
  },
  (t) => [
    index("programmes_public_idx").on(t.status, t.sortOrder),
    check(
      "programmes_start_month",
      sql`${t.startMonth} is null or ${t.startMonth} between 1 and 12`,
    ),
  ],
);

/** A programme's selected modules, shown in order on its page. */
export const programmeModules = pgTable(
  "programme_modules",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    programmeId: integer("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    /** e.g. "CTE101". */
    code: varchar("code", { length: 40 }),
    /**
     * False for a description written for the prototype rather than published by the college:
     * the department should check it. (Shown as such in the admin panel only.)
     */
    descriptionConfirmed: boolean("description_confirmed").notNull().default(true),
    sortOrder: sortOrder(),
    ...timestamps(),
  },
  (t) => [index("programme_modules_programme_idx").on(t.programmeId, t.sortOrder)],
);

/** The laboratories and facilities a programme's page lists. */
export const programmeFacilities = pgTable(
  "programme_facilities",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    programmeId: integer("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    sortOrder: sortOrder(),
    ...timestamps(),
  },
  (t) => [index("programme_facilities_programme_idx").on(t.programmeId, t.sortOrder)],
);

export const events = pgTable(
  "events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    location: varchar("location", { length: 200 }),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    status: status(),
    ...timestamps(),
  },
  (t) => [
    index("events_public_idx").on(t.status, t.startDate),
    check("events_dates_in_order", sql`${t.endDate} is null or ${t.endDate} >= ${t.startDate}`),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 300 }).notNull(),
    /** Its page is /announcements/<slug>. */
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    /** The editor's document (Tiptap JSON), sanitised on saving (src/lib/rich-text.ts). */
    content: jsonb("content").notNull(),
    /** The opening of its text, kept in step with `content`, for listings. */
    summary: text("summary"),
    publishedOn: date("published_on").notNull(),
    /** An optional PDF, linked from the notice. */
    attachmentId: mediaRef("attachment_id"),
    status: status(),
    ...timestamps(),
  },
  (t) => [
    index("announcements_public_idx").on(t.status, t.publishedOn),
    check("announcements_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);
