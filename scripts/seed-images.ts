/**
 * Copies an image from public/ into the upload store (UPLOAD_DIR/images) and records it in
 * `media`, as if it had been uploaded in the admin panel. Used by the seed scripts.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import type { getDb, schema as Schema } from "../src/lib/db";
import { uploadPath } from "../src/lib/media/paths";

type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const FORMATS = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
} as const;

/**
 * Copies images into the store within a transaction. `written` lists the files copied, so
 * `discard()` can remove them again if the transaction fails.
 */
export function imageCopier(schema: typeof Schema) {
  const written: string[] = [];

  async function copy(tx: Tx, publicPath: string) {
    const data = await readFile(path.join(process.cwd(), "public", publicPath));
    const meta = await sharp(data).metadata();
    const format = FORMATS[meta.format as keyof typeof FORMATS];
    if (!format) throw new Error(`${publicPath} is not a JPEG, PNG or WebP image`);

    const storageKey = `${randomUUID()}.${format.extension}`;
    await mkdir(path.dirname(uploadPath(storageKey)), { recursive: true });
    await writeFile(uploadPath(storageKey), data, { flag: "wx", mode: 0o640 });
    written.push(storageKey);

    const [row] = await tx
      .insert(schema.media)
      .values({
        kind: "image",
        storageKey,
        originalName: path.basename(publicPath),
        mimeType: format.mimeType,
        byteSize: data.length,
        width: meta.width ?? null,
        height: meta.height ?? null,
      })
      .returning({ id: schema.media.id });
    return row.id;
  }

  async function discard() {
    await Promise.all(written.splice(0).map((key) => unlink(uploadPath(key)).catch(() => {})));
  }

  return { copy, discard, written };
}
