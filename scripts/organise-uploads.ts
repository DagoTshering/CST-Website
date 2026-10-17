/**
 * Moves uploaded files that sit directly in UPLOAD_DIR (how they were stored before images and
 * documents had their own folders) into storage/uploads/images/ or storage/uploads/documents/.
 *
 *   pnpm uploads:organise
 *
 * Safe to rerun: files already in place are left alone, and nothing else is touched. Only names
 * of the form <uuid>.<jpg|png|webp|pdf> are moved; their database rows do not change.
 */
import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { uploadDir, uploadPath } = await import("../src/lib/media/paths");
  const { STORAGE_KEY_PATTERN } = await import("../src/lib/media/url");

  const entries = await readdir(uploadDir(), { withFileTypes: true }).catch(() => []);
  let moved = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !STORAGE_KEY_PATTERN.test(entry.name)) continue;
    const target = uploadPath(entry.name);
    await mkdir(path.dirname(target), { recursive: true });
    await rename(path.join(uploadDir(), entry.name), target);
    moved++;
  }
  console.log(`Moved ${moved} file${moved === 1 ? "" : "s"} into images/ and documents/.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
