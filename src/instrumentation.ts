/**
 * Runs once when the Next.js server starts, before it handles any request.
 *
 * It opens the database connection pool here. The postgres client calls Math.random() as it is
 * created and whenever it opens a connection (a statement id, and a connection lifetime unless
 * one is set), and Next.js does not allow random values while it prerenders a page ("Next.js
 * encountered the unstable value Math.random()"). Opened here, outside any request, and kept
 * open (see src/lib/db/index.ts), the connections are only borrowed by pages.
 */
export async function register() {
  // Not in the Edge runtime (proxy.ts), and not without a database (e.g. a Docker image build).
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;

  const { openDbPool } = await import("@/lib/db");
  try {
    await openDbPool();
  } catch (error) {
    // The site still starts; connections then open on first use.
    console.error("Could not connect to the database at startup:", error);
  }
}
