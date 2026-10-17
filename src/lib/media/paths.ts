import path from "node:path";

/*
 * Where uploaded files live on disk: UPLOAD_DIR (default storage/uploads), with images and
 * documents in separate folders:
 *
 *   storage/uploads/images/<uuid>.jpg|png|webp
 *   storage/uploads/documents/<uuid>.pdf
 *
 * The folder follows from the file's name (its extension is the verified type), so the
 * database and the /media URLs need not know about it. Not marked "server-only": the seed
 * scripts (run with tsx, outside Next.js) store files here too.
 */

export function uploadDir() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOAD_DIR || "storage/uploads",
  );
}

/** The folder for a stored file: "images" or "documents". */
export function uploadFolder(storageKey: string) {
  return storageKey.endsWith(".pdf") ? "documents" : "images";
}

/** The full path of a stored file. Check the key against STORAGE_KEY_PATTERN first. */
export function uploadPath(storageKey: string) {
  return path.join(uploadDir(), uploadFolder(storageKey), storageKey);
}
