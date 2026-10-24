import { sql } from "drizzle-orm";
import {
  check,
  integer,
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
 * The Contact page (/contact): what it says once (the settings), the offices of its directory
 * and the college's pages elsewhere online.
 */

const mediaRef = (name: string) => uuid(name).references(() => media.id, { onDelete: "set null" });
const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** A single row (id 1). */
export const contactSettings = pgTable(
  "contact_settings",
  {
    id: integer("id").primaryKey().default(1),
    /** Under the page's title. */
    intro: varchar("intro", { length: 400 }).notNull(),
    bannerImageId: mediaRef("banner_image_id"),
    bannerImageAlt: varchar("banner_image_alt", { length: 300 }),
    /** The postal address, a line each. */
    addressLines: text("address_lines").array().notNull(),
    postal: varchar("postal", { length: 200 }),
    /** "Directions" and "Open in Google Maps". */
    mapLink: varchar("map_link", { length: 500 }).notNull(),
    /** The embedded map: a Google Maps address (the only maps the site's CSP allows). */
    mapEmbed: varchar("map_embed", { length: 1000 }).notNull(),
    /** Days the office opens, 0 = Sunday; times "HH:MM" in Bhutan time. */
    openDays: smallint("open_days").array().notNull(),
    opensAt: varchar("opens_at", { length: 5 }).notNull(),
    closesAt: varchar("closes_at", { length: 5 }).notNull(),
    /** The college's main number and address ("Get in touch"). */
    phone: varchar("phone", { length: 40 }),
    phoneNote: varchar("phone_note", { length: 120 }),
    email: varchar("email", { length: 254 }),
    whatsappUrl: varchar("whatsapp_url", { length: 500 }),
    ...timestamps(),
  },
  (t) => [
    check("contact_settings_single_row", sql`${t.id} = 1`),
    check("contact_settings_hours_in_order", sql`${t.opensAt} < ${t.closesAt}`),
  ],
);

/** The directory ("Who to contact"); an office with an email can be written to. */
export const contactOffices = pgTable(
  "contact_offices",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }),
    phone: varchar("phone", { length: 40 }),
    sortOrder: integer("sort_order").notNull().default(0),
    status: contentStatus("status").notNull().default("draft"),
    ...timestamps(),
  },
  (t) => [
    check("contact_offices_reachable", sql`${t.email} is not null or ${t.phone} is not null`),
  ],
);

/** "Find us online": the college's pages on other sites. */
export const contactSocialLinks = pgTable("contact_social_links", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  label: varchar("label", { length: 60 }).notNull(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  status: contentStatus("status").notNull().default("draft"),
  ...timestamps(),
});
