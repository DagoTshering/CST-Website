import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";

import sharp from "sharp";

import { uploadPath } from "./paths";
import { STORAGE_KEY_PATTERN } from "./url";

/*
 * Uploaded files on local disk, under UPLOAD_DIR (default storage/uploads, a Docker volume in
 * production), images and documents in separate folders (see paths.ts). File names are generated here, never taken from the upload, and every path is
 * checked against STORAGE_KEY_PATTERN, so nothing outside the directory can be reached.
 */

export const UPLOAD_LIMITS = {
  image: 8 * 1024 * 1024,
  // the largest document imported from the old site's Downloads page (the student handbook) is 71 MB
  document: 100 * 1024 * 1024,
} as const;

/** Largest side of a stored image; bigger uploads are scaled down. */
const MAX_IMAGE_SIDE = 2560;

function filePath(storageKey: string) {
  if (!STORAGE_KEY_PATTERN.test(storageKey)) throw new Error("Invalid storage key");
  return uploadPath(storageKey);
}

export type ProcessedFile = {
  data: Buffer;
  extension: "jpg" | "png" | "webp" | "pdf";
  mimeType: string;
  width: number | null;
  height: number | null;
};

const IMAGE_TYPES = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
} as const;

/**
 * Decodes the upload as an image, whatever the browser claimed it was, and re-encodes it. That
 * rejects anything that is not really a JPEG, PNG or WebP, drops metadata such as GPS location,
 * applies the camera's rotation and caps the size. Returns null when it is not an accepted image.
 */
export async function processImage(input: Buffer): Promise<ProcessedFile | null> {
  try {
    const meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
    const type = IMAGE_TYPES[meta.format as keyof typeof IMAGE_TYPES];
    if (!type) return null;

    const pipeline = sharp(input, { limitInputPixels: 50_000_000 }).rotate().resize({
      width: MAX_IMAGE_SIDE,
      height: MAX_IMAGE_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    });
    const encoded =
      type.extension === "jpg"
        ? pipeline.jpeg({ quality: 85, mozjpeg: true })
        : type.extension === "png"
          ? pipeline.png()
          : pipeline.webp({ quality: 85 });
    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });

    return { data, ...type, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

/** Accepts the upload only if it starts with the PDF signature. */
export function processPdf(input: Buffer): ProcessedFile | null {
  if (input.subarray(0, 5).toString("latin1") !== "%PDF-") return null;
  return { data: input, extension: "pdf", mimeType: "application/pdf", width: null, height: null };
}

/** Writes the file under a new random name and returns that name. */
export async function storeFile(file: ProcessedFile): Promise<string> {
  const storageKey = `${randomUUID()}.${file.extension}`;
  await mkdir(path.dirname(filePath(storageKey)), { recursive: true });
  // "wx" never overwrites; 0o640 keeps files non-executable.
  await writeFile(filePath(storageKey), file.data, { flag: "wx", mode: 0o640 });
  return storageKey;
}

export async function removeFile(storageKey: string) {
  await unlink(filePath(storageKey)).catch(() => undefined);
}

/** The file as a stream with its size, or null when it is missing from disk. */
export async function openStoredFile(storageKey: string) {
  try {
    const location = filePath(storageKey);
    const { size } = await stat(location);
    const body = Readable.toWeb(createReadStream(location)) as ReadableStream<Uint8Array>;
    return { body, size };
  } catch {
    return null;
  }
}

/** A display name for the uploaded file: no path, no control characters, bounded length. */
export function cleanOriginalName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return (cleaned || "upload").slice(0, 255);
}
