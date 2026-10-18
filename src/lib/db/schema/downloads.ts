import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { programmes } from "./content";
import { contentStatus } from "./enums";
import { media } from "./media";

/*
 * The Downloads page: documents grouped into categories. A download is either a file (an
 * uploaded PDF in `media`) or a link (a Google Drive folder, another website's page).
 */

export const downloadKind = pgEnum("download_kind", ["file", "link"]);

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const downloadCategories = pgTable("download_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  description: text("description"),
  /**
   * Each download in the category must be filed under a programme, and the Downloads page groups
   * them by programme (the students' project reports).
   */
  groupByProgramme: boolean("group_by_programme").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
});

export const downloads = pgTable(
  "downloads",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    /** A category with downloads cannot be deleted. */
    categoryId: integer("category_id")
      .notNull()
      .references(() => downloadCategories.id, { onDelete: "restrict" }),
    /** An optional heading within the category (categories not grouped by programme). */
    groupLabel: varchar("group_label", { length: 120 }),
    /**
     * The programme it is filed under, in a category grouped by programme. A programme with
     * downloads cannot be deleted.
     */
    programmeId: integer("programme_id").references(() => programmes.id, { onDelete: "restrict" }),
    kind: downloadKind("kind").notNull(),
    /** For a file: the uploaded PDF. Restrict, so a file in use cannot disappear. */
    fileId: uuid("file_id").references(() => media.id, { onDelete: "restrict" }),
    /** For a link: where it goes (https only). */
    externalUrl: varchar("external_url", { length: 2000 }),
    publishedOn: date("published_on"),
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    /** Identifies a download imported from the previous website, so the seed adds it once. */
    legacyKey: varchar("legacy_key", { length: 64 }).unique(),
    ...timestamps(),
  },
  (t) => [
    index("downloads_public_idx").on(t.status, t.categoryId, t.sortOrder),
    index("downloads_programme_idx").on(t.programmeId),
    check(
      "downloads_file_or_link",
      sql`(${t.kind} = 'file' and ${t.fileId} is not null and ${t.externalUrl} is null)
        or (${t.kind} = 'link' and ${t.fileId} is null and ${t.externalUrl} like 'https://%')`,
    ),
  ],
);

/**
 * Imported downloads an administrator has deleted. The seed skips these keys, so a deleted
 * download does not come back the next time the seed runs.
 */
export const seedTombstones = pgTable("seed_tombstones", {
  key: varchar("key", { length: 80 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DownloadKind = (typeof downloadKind.enumValues)[number];
