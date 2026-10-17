import "server-only";

import { eq } from "drizzle-orm";

import type { Photo } from "@/content/home";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { MediaPreview } from "../form";

const { media } = schema;

/** Media columns the admin and public queries need. */
export const mediaColumns = {
  id: media.id,
  storageKey: media.storageKey,
  originalName: media.originalName,
  kind: media.kind,
  width: media.width,
  height: media.height,
};

type MediaRow = {
  id: string;
  storageKey: string;
  originalName: string;
  kind: "image" | "document";
};

/** An attached file as the edit form shows it. */
export async function loadPreview(id: string | null): Promise<MediaPreview | null> {
  if (!id) return null;
  const [row] = await getDb().select(mediaColumns).from(media).where(eq(media.id, id)).limit(1);
  return row ? toPreview(row) : null;
}

export function toPreview(row: MediaRow): MediaPreview {
  return { id: row.id, url: mediaUrl(row.storageKey), name: row.originalName, kind: row.kind };
}

/** An uploaded image in the shape the homepage components take. */
export function toPhoto(
  row: { storageKey: string; width: number | null; height: number | null },
  alt: string | null,
): Photo {
  return {
    src: mediaUrl(row.storageKey),
    width: row.width ?? 1200,
    height: row.height ?? 900,
    alt: alt ?? "",
  };
}

/** A database value as a form field's string. */
export const asField = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);
