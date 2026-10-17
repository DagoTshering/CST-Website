import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { media } from "./media";

/*
 * Website content managed in the admin panel. Every table has a draft/published status; the
 * public site only ever reads published rows.
 */

export const contentStatus = pgEnum("content_status", ["draft", "published"]);
export const programmeLevel = pgEnum("programme_level", ["undergraduate", "postgraduate"]);

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
    name: varchar("name", { length: 200 }).notNull(),
    level: programmeLevel("level").notNull(),
    shortDescription: text("short_description"),
    /** Year the programme was first offered. */
    startYear: smallint("start_year"),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    sortOrder: sortOrder(),
    status: status(),
    ...timestamps(),
  },
  (t) => [index("programmes_public_idx").on(t.status, t.sortOrder)],
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

export const leaders = pgTable(
  "leaders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 160 }).notNull(),
    designation: varchar("designation", { length: 200 }).notNull(),
    biography: text("biography"),
    portraitId: mediaRef("portrait_id"),
    portraitAlt: varchar("portrait_alt", { length: 300 }),
    sortOrder: sortOrder(),
    status: status(),
    ...timestamps(),
  },
  (t) => [index("leaders_public_idx").on(t.status, t.sortOrder)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 300 }).notNull(),
    summary: text("summary"),
    publishedOn: date("published_on").notNull(),
    category: varchar("category", { length: 60 }),
    /** An optional PDF, linked from the notice. */
    attachmentId: mediaRef("attachment_id"),
    status: status(),
    ...timestamps(),
  },
  (t) => [index("announcements_public_idx").on(t.status, t.publishedOn)],
);

export type ContentStatus = (typeof contentStatus.enumValues)[number];
export type ProgrammeLevel = (typeof programmeLevel.enumValues)[number];
