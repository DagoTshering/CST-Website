import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Load .env / .env.local the same way Next.js does. Variables that are already
// set in the environment (e.g. inside Docker) take precedence.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    // Not needed for `db:generate`; required for `db:migrate` and `db:studio`.
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
