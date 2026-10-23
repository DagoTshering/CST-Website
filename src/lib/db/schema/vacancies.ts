import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { contentStatus } from "./enums";
import { media } from "./media";

/*
 * The Vacancies page (/vacancies): job recruitment notices only (vacancies, shortlists,
 * interview and examination schedules, results, selections). General college announcements are
 * a separate table (announcements) and are never stored here.
 */

export const vacancyCategory = pgEnum("vacancy_category", [
  "job_vacancy",
  "recruitment_notice",
  "shortlist",
  "interview_schedule",
  "examination_result",
  "final_selection",
  "other",
]);

export const vacancies = pgTable(
  "vacancies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 300 }).notNull(),
    /** Its page is /vacancies/<slug>. */
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    category: vacancyCategory("category").notNull(),
    /** The editor's document (Tiptap JSON), sanitised on saving (src/lib/rich-text.ts). */
    content: jsonb("content").notNull(),
    /** The opening of its text, for the listing and the search (kept in step with `content`). */
    excerpt: text("excerpt").notNull().default(""),
    /** The official notice as a PDF, for visitors to download. */
    attachmentId: uuid("attachment_id").references(() => media.id, { onDelete: "set null" }),
    status: contentStatus("status").notNull().default("draft"),
    /** When it was first published; kept if it is unpublished and published again. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("vacancies_public_idx").on(t.status, t.publishedAt),
    index("vacancies_category_idx").on(t.category, t.status, t.publishedAt),
    check("vacancies_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("vacancies_published_at", sql`${t.status} = 'draft' or ${t.publishedAt} is not null`),
  ],
);

/**
 * Addresses a post had before its web address was changed: each redirects to the post's current
 * page (while it is published), so old links and search results keep working. An address taken
 * by a post again stops redirecting.
 */
export const vacancySlugRedirects = pgTable("vacancy_slug_redirects", {
  slug: varchar("slug", { length: 160 }).primaryKey(),
  vacancyId: integer("vacancy_id")
    .notNull()
    .references(() => vacancies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
