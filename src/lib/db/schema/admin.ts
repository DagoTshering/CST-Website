import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Administrators of the website. There is no self-registration: accounts are created by the
 * seed script (scripts/seed.ts). The email is stored normalised (trimmed, lower case), which
 * the check constraint enforces, so the unique constraint applies to the normalised address.
 */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 120 }),
    /** Argon2id hash in PHC string format. Never leaves the server. */
    passwordHash: text("password_hash").notNull(),
    /** Null until the administrator replaces the initial (seeded) password. */
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("admin_users_email_normalised", sql`${t.email} = lower(btrim(${t.email}))`)],
);

/**
 * Server-side sessions. The cookie carries a random token; only its SHA-256 hash is stored,
 * so a leaked database row cannot be replayed as a cookie.
 */
export const adminSessions = pgTable(
  "admin_sessions",
  {
    /** SHA-256 of the session token, hex encoded. */
    id: varchar("id", { length: 64 }).primaryKey(),
    adminId: integer("admin_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessions_admin_id_idx").on(t.adminId)],
);

/**
 * Login attempts, for throttling repeated failures by email and by client address. Rows older
 * than a day are pruned on each attempt.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    /** Normalised email as typed; it need not belong to an account. */
    email: varchar("email", { length: 320 }).notNull(),
    ip: varchar("ip", { length: 64 }).notNull(),
    succeeded: boolean("succeeded").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
);

export type AdminUser = typeof adminUsers.$inferSelect;
