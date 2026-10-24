import { index, integer, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { contentStatus } from "./enums";
import { media } from "./media";

/*
 * The Partners page (/about/partners): the universities, agencies, companies and foundations the
 * college works with, abroad (listed by country) and in Bhutan (listed by type).
 */

export const partnerCategory = pgEnum("partner_category", ["international", "national"]);

export const partnerType = pgEnum("partner_type", [
  "university",
  "research",
  "government",
  "industry",
  "foundation",
  "programme",
  "finance",
]);

export const partners = pgTable(
  "partners",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 200 }).notNull(),
    category: partnerCategory("category").notNull(),
    type: partnerType("type").notNull(),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 120 }).notNull(),
    /** A short line under the city, e.g. "European Union", "through the Obel Foundation". */
    note: varchar("note", { length: 200 }),
    /** The partner's own website; their card links to it. */
    websiteUrl: varchar("website_url", { length: 500 }),
    /** Without one, the card shows the partner's initials. */
    logoId: uuid("logo_id").references(() => media.id, { onDelete: "set null" }),
    /** Order within the category. */
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("partners_public_idx").on(t.status, t.category, t.sortOrder)],
);

export type PartnerCategory = (typeof partnerCategory.enumValues)[number];
export type PartnerType = (typeof partnerType.enumValues)[number];
