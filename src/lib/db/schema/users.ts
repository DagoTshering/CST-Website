import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Example table used only to verify the database and ORM setup.
 * It is not wired to any authentication or user-management feature.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
