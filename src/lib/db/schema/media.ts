import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { adminUsers } from "./admin";

export const mediaKind = pgEnum("media_kind", ["image", "document"]);

/**
 * Uploaded files. The bytes live on disk under UPLOAD_DIR (see src/lib/media/storage.ts);
 * this table records what each file is and who uploaded it. Content rows reference it by id.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: mediaKind("kind").notNull(),
  /** File name on disk: a random UUID plus the extension of the verified type. */
  storageKey: varchar("storage_key", { length: 80 }).notNull().unique(),
  /** The uploader's file name, for display only. */
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  uploadedBy: integer("uploaded_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Media = typeof media.$inferSelect;
export type MediaKind = (typeof mediaKind.enumValues)[number];
