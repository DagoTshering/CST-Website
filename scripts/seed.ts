/**
 * Creates the initial administrator from ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD, then the
 * homepage's initial content (see seed-content.ts) and the Downloads page's documents imported
 * from the previous website (see seed-downloads.ts).
 *
 *   pnpm db:seed
 *
 * Safe to rerun: an existing administrator with that email is left untouched, so the seed never
 * creates a duplicate or resets a password that has since been changed, and content is only
 * seeded into empty tables. No credentials live in
 * this file; they are read from the environment (.env locally, the container environment in
 * Docker).
 *
 * WARNING: the initial password is for first sign-in only. Change it in Admin → Settings before
 * the site goes into production, then remove ADMIN_INITIAL_PASSWORD from the environment.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  // Imported after the environment is loaded: the database client reads DATABASE_URL.
  const { getDb, schema } = await import("../src/lib/db");
  const { hashPassword, normaliseEmail, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } =
    await import("../src/lib/auth/password");
  const { seedContent } = await import("./seed-content");
  const { seedDownloads } = await import("./seed-downloads");

  const email = normaliseEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL is missing or not an email address. Set it in .env.");
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(
      `ADMIN_INITIAL_PASSWORD must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters. Set it in .env.`,
    );
  }

  const db = getDb();
  try {
    const created = await db
      .insert(schema.adminUsers)
      .values({ email, passwordHash: await hashPassword(password), name: "Administrator" })
      .onConflictDoNothing({ target: schema.adminUsers.email })
      .returning({ id: schema.adminUsers.id });

    if (created.length > 0) {
      console.log(`Created administrator ${email}.`);
      console.warn(
        "WARNING: this account uses the initial password. Sign in and change it (Admin → Settings) before production deployment.",
      );
    } else {
      console.log(`Administrator ${email} already exists; left unchanged (password not reset).`);
    }

    await seedContent(db, schema);
    await seedDownloads(db, schema);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
