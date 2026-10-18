/**
 * The student clubs on the Student Hub (/student-hub).
 *
 * The content lives in data/clubs.json, a copy of docs/reference/clubs.json: the single source of
 * truth, in alphabetical order of the photo folders. Where a field is null the page says it is
 * still to be added; nothing is filled in here.
 *
 * Photos come from data/club-photos.json, written by `pnpm photos` (scripts/optimize-club-photos.mjs)
 * with the files in public/clubs/<slug>/. Until it has been run, or for a club it has no folder
 * for, a club simply has no photos.
 *
 * Full names confirmed by the web team on 2026-10-18: BTO, E-Club and NDLD; BRCS is already in
 * full. TODO(confirm) with the college: Nangpai Zhenu's full name (described to us as a prayer
 * club); a description, activities and an advisor or contact for every club with none.
 */
import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { site } from "@/content/site";

import data from "../../data/clubs.json";

export type Club = {
  slug: string;
  /** The source photo folder's name (used by the photo script only). */
  folder: string;
  name: string;
  fullName: string | null;
  about: string | null;
  activities: string[] | null;
  /** The advisor or contact line. */
  contact: string | null;
};

type ClubPhotos = { count: number; photos: string[]; thumbs: string[] };

export type ClubWithPhotos = Club & {
  /** Full-size WebP files for the photo band, at most 12. */
  photos: string[];
  /** Small thumbnails of the first two photos, for the index's hover preview. */
  thumbs: string[];
};

/** The script's manifest, or nothing if it has not been run yet. */
function readPhotoManifest(): Record<string, ClubPhotos> {
  try {
    const file = path.join(process.cwd(), "data", "club-photos.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

const manifest = readPhotoManifest();

export const clubs: ClubWithPhotos[] = (data.clubs as Club[]).map((club) => ({
  ...club,
  photos: manifest[club.slug]?.photos ?? [],
  thumbs: manifest[club.slug]?.thumbs ?? [],
}));

export const getClub = (slug: string) => clubs.find((club) => club.slug === slug);

/** The title and description of a club's page, and of its pop-up (so the tab shows the club). */
export function clubMetadata(slug: string): Metadata {
  const club = getClub(slug);
  if (!club) return {};
  return {
    title: { absolute: `${club.name} | Student Hub | ${site.name}` },
    description: club.about ?? `${club.name}, a student club at the ${site.name}.`,
  };
}

/** A club's own page (opened over the list as a pop-up when followed from it). */
export const clubHref = (slug: string) => `/student-hub/${slug}`;
