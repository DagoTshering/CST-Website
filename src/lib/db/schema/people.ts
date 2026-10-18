import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { contentStatus, programmes } from "./content";
import { media } from "./media";

/*
 * People: the staff directory (/about/staff-directory) and the executives (/about/executives,
 * and the President on the homepage). Executives are kept apart from staff: they are a few
 * positions on a chart, and not every executive is in the directory. An executive who is can be
 * linked to their staff record.
 */

export const departmentKind = pgEnum("department_kind", ["department", "administration"]);

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Academic departments and administrative units. A unit with staff cannot be deleted. */
export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Short code, e.g. "CEED"; unique. */
  code: varchar("code", { length: 12 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  kind: departmentKind("kind").notNull().default("department"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
});

/** Positions a staff member can hold ("Lecturer", "Sr. Technician"). One in use cannot be deleted. */
export const designations = pgTable("designations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  ...timestamps(),
});

export const staff = pgTable(
  "staff",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 160 }).notNull(),
    /** Their position, from the list of designations. */
    designationId: integer("designation_id")
      .notNull()
      .references(() => designations.id, { onDelete: "restrict" }),
    /** Duties from a fixed list ("HoD", "PL", "DAA", "DSA"); see src/lib/cms/resources/staff.ts. */
    duties: text("duties")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    email: varchar("email", { length: 320 }),
    photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
    /** Order within the department. */
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    /** The record's id in the original staff export, so the seed adds each person once. */
    legacyKey: varchar("legacy_key", { length: 80 }).unique(),
    ...timestamps(),
  },
  (t) => [index("staff_public_idx").on(t.status, t.departmentId, t.sortOrder)],
);

/** The programmes a lecturer teaches on. A programme with staff cannot be deleted. */
export const staffProgrammes = pgTable(
  "staff_programmes",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    programmeId: integer("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.staffId, t.programmeId] }),
    index("staff_programmes_programme_idx").on(t.programmeId),
  ],
);

export const executives = pgTable(
  "executives",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 160 }).notNull(),
    /** e.g. "President", "Dean". */
    role: varchar("role", { length: 80 }).notNull(),
    /** What the role covers, e.g. "Academic Affairs" (shown as "Dean of Academic Affairs"). */
    scope: varchar("scope", { length: 160 }),
    /** 1: the head of the chart (the President); 2: the row below (the Deans). */
    level: smallint("level").notNull().default(2),
    /** Left to right within the level. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Their staff-directory record, when they have one. */
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    /** Without one, the linked staff record's photo is used. */
    photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
    photoAlt: varchar("photo_alt", { length: 300 }),
    /** Shown on the homepage for the head of the chart. */
    biography: text("biography"),
    status: contentStatus("status").notNull().default("draft"),
    legacyKey: varchar("legacy_key", { length: 80 }).unique(),
    ...timestamps(),
  },
  (t) => [
    index("executives_public_idx").on(t.status, t.level, t.sortOrder),
    check("executives_level", sql`${t.level} in (1, 2)`),
  ],
);

export type DepartmentKind = (typeof departmentKind.enumValues)[number];
