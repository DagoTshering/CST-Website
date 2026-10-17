import path from "node:path";

/**
 * The directory uploaded files are stored in (UPLOAD_DIR, default storage/uploads). Not marked
 * "server-only": the seed script (run with tsx, outside Next.js) stores files there too.
 */
export function uploadDir() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOAD_DIR || "storage/uploads",
  );
}
