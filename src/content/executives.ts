/**
 * The executives page (/about/executives): the President and the three Deans, as on the old
 * site's Executives page (no biographies or contact details: it has none).
 *
 * The data lives in executives.json, in one place so a future admin panel can edit it. Photos are
 * downloaded into public/images/executives/ by scripts/download-executive-photos.mjs; a person
 * with no photo shows their initials.
 *
 * Chimi is listed with one name only, as on the old site.
 */
import data from "./executives.json";

export type Executive = {
  id: string;
  name: string;
  /** e.g. "President", "Dean". */
  role: string;
  /** What a Dean is responsible for, e.g. "Academic Affairs". */
  scope?: string;
  /** 1: the President, at the top of the chart; 2: the Deans, in a row below. */
  level: 1 | 2;
  /** Left to right within the level. */
  order: number;
  /** A path under /images/executives, or null to show the person's initials. */
  photo: string | null;
  alt: string;
};

const executives = data.executives as Executive[];

const byOrder = (a: Executive, b: Executive) => a.order - b.order;

/** The head of the chart: the President. */
export const president = executives.filter((e) => e.level === 1).sort(byOrder)[0];

/** The Deans, left to right. */
export const deans = executives.filter((e) => e.level === 2).sort(byOrder);

/** "Dean of Academic Affairs", "President": the role as one phrase, for labels. */
export const roleTitle = (e: Executive) => (e.scope ? `${e.role} of ${e.scope}` : e.role);

/** Two initials for a portrait placeholder, ignoring a title: "Dr. Sangey Pasang" -> "SP". */
export function initials(name: string) {
  const parts = name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
