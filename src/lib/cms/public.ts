import "server-only";

import { connection } from "next/server";

/**
 * Loads a homepage section's published content. It runs at request time (never during the
 * build, which has no database), reading through the section's cached query; the admin panel
 * refreshes that cache when content changes. If the database cannot be reached, the section is
 * left out rather than the whole page failing.
 */
export async function loadPublished<T>(section: string, load: () => Promise<T>) {
  await connection();
  try {
    return { ok: true as const, data: await load() };
  } catch (error) {
    console.error(`Homepage: could not load ${section}`, error);
    return { ok: false as const };
  }
}
