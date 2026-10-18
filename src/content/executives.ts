/**
 * The executives page (/about/executives): the type its components share, and helpers.
 *
 * The executives are managed in the admin panel (Admin › Executives) and read from the database
 * (src/lib/cms/resources/executives.ts); they were seeded from data/people/executives.json. The
 * head of the chart (level 1) is also featured on the homepage. Chimi is listed with one name
 * only, as on the old site.
 */
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
  /** The photo's URL, or null to show the person's initials. */
  photo: string | null;
  alt: string;
};

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
