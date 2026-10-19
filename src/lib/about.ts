/**
 * The About page (/about).
 *
 * The content lives in data/about.json, a copy of docs/reference/about.json and the single source
 * of truth. The four paragraphs are the text the college supplied and are rendered verbatim. Its
 * `meta` is notes for the web team (what still needs confirming) and is never exported.
 *
 * To confirm with the college: RBIT's year (2002 here; other sources say 2001), the 2006 rename,
 * the centres' missing full names, descriptions, photos and contacts, whether the planned PhD
 * stays on the page, and the programme counts (they change as programmes are added).
 */
import data from "../../data/about.json";

export type Name = { year: string; name: string; note: string };

export type CentreGroup = "research" | "innovation";

export type Centre = {
  group: CentreGroup;
  acronym: string;
  fullName: string | null;
  text: string | null;
};

export type About = {
  title: string;
  /** The four paragraphs, verbatim: intro, vision, what the college offers, research. */
  paragraphs: [string, string, string, string];
  /** The college's names, oldest first. */
  names: Name[];
  vision: string;
  pillars: [string, string, string];
  numbers: { undergraduate: number; postgraduate: number; planned: string };
  services: string[];
  focus: string;
  centres: Centre[];
};

const isGroup = (group: string): group is CentreGroup =>
  group === "research" || group === "innovation";

/** Fails the build, rather than the page, if the JSON loses its expected shape. */
function check<T>(ok: boolean, value: T, what: string): T {
  if (!ok) throw new Error(`data/about.json: ${what}`);
  return value;
}

// Everything but `meta`, the web team's notes.
export const about: About = {
  title: data.title,
  paragraphs: check(
    data.paragraphs.length === 4,
    data.paragraphs as About["paragraphs"],
    "expected 4 paragraphs",
  ),
  names: data.names,
  vision: data.vision,
  pillars: check(data.pillars.length === 3, data.pillars as About["pillars"], "expected 3 pillars"),
  numbers: data.numbers,
  services: data.services,
  focus: data.focus,
  centres: data.centres.map((c) => ({
    ...c,
    group: check(isGroup(c.group), c.group as CentreGroup, `unknown centre group "${c.group}"`),
  })),
};
