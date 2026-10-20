import { sql } from "drizzle-orm";
import {
  check,
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

import { contentStatus } from "./enums";
import { media } from "./media";

/*
 * The About page (/about): its text, the college's names over the years, and its research and
 * innovation centres. (The homepage's About CST section is a separate record: about_section.)
 */

export const centreGroup = pgEnum("centre_group", ["research", "innovation"]);

const mediaRef = (name: string) => uuid(name).references(() => media.id, { onDelete: "set null" });
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * The page's text, section by section: a single row (id 1). Each heading may set a word or phrase
 * of itself in colour (its *Emphasis).
 */
export const aboutPage = pgTable(
  "about_page",
  {
    id: integer("id").primaryKey().default(1),
    /** The college, beside a campus photo. */
    introHeading: varchar("intro_heading", { length: 200 }).notNull(),
    introEmphasis: varchar("intro_emphasis", { length: 80 }),
    introText: text("intro_text").notNull(),
    introImageId: mediaRef("intro_image_id"),
    introImageAlt: varchar("intro_image_alt", { length: 300 }),
    /** Above the timeline of the college's names. */
    namesHeading: varchar("names_heading", { length: 200 }).notNull(),
    namesEmphasis: varchar("names_emphasis", { length: 80 }),
    namesText: text("names_text"),
    /** The vision as a quote, then a paragraph, then what it is pursued through. */
    vision: varchar("vision", { length: 300 }).notNull(),
    visionEmphasis: varchar("vision_emphasis", { length: 80 }),
    visionText: text("vision_text"),
    pillars: text("pillars")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** What the college offers: the programme counts come from Academic Programmes. */
    offerHeading: varchar("offer_heading", { length: 200 }).notNull(),
    offerEmphasis: varchar("offer_emphasis", { length: 80 }),
    offerText: text("offer_text"),
    /** A programme to come, e.g. "PhD in Engineering". */
    plannedProgramme: varchar("planned_programme", { length: 120 }),
    services: text("services")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Above the research and innovation centres. */
    centresHeading: varchar("centres_heading", { length: 200 }).notNull(),
    centresEmphasis: varchar("centres_emphasis", { length: 80 }),
    centresText: text("centres_text"),
    ...timestamps(),
  },
  (t) => [check("about_page_single_row", sql`${t.id} = 1`)],
);

/** The college's names, shown on the timeline in order of year. */
export const collegeNames = pgTable(
  "college_names",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    year: smallint("year").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    /** e.g. "Established", "Renamed CST". */
    note: varchar("note", { length: 120 }),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    ...timestamps(),
  },
  (t) => [
    index("college_names_year_idx").on(t.year),
    check("college_names_year", sql`${t.year} between 1900 and 2100`),
  ],
);

/** The research and innovation centres, each group in its own order. */
export const researchCentres = pgTable(
  "research_centres",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    group: centreGroup("centre_group").notNull(),
    /** What the centre is called on the page, e.g. "CRSED", "FabLab CST". */
    acronym: varchar("acronym", { length: 80 }).notNull(),
    fullName: varchar("full_name", { length: 200 }),
    description: text("description"),
    websiteUrl: varchar("website_url", { length: 500 }),
    email: varchar("email", { length: 254 }),
    imageId: mediaRef("image_id"),
    imageAlt: varchar("image_alt", { length: 300 }),
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    ...timestamps(),
  },
  (t) => [index("research_centres_public_idx").on(t.status, t.group, t.sortOrder)],
);
