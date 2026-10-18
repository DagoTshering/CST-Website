/**
 * The Programmes section (/programmes and /programmes/[slug]): the types its components share,
 * and a helper.
 *
 * The programmes are managed in the admin panel (Admin › Academic Programmes: each programme's
 * page, its modules and facilities, and the admission details) and read from the database
 * (src/lib/cms/resources/programme-pages.ts). They were seeded from data/programmes/programmes.json,
 * a copy of docs/reference/programmes.json, whose notes on what still needs confirming with the
 * college (departments, entry requirements, start dates, draft module descriptions, documents)
 * still apply.
 */

/** A department's code, as in the Staff Directory (e.g. "CEED"). */
export type DepartmentKey = string;

export type Module = {
  name: string;
  description: string | null;
  /** "site": published on the old site. "draft": written for the prototype, to be confirmed. */
  descriptionSource: "site" | "draft" | null;
  code: string | null;
};

export type Structure =
  | { kind: "none" }
  | { kind: "modules"; intro: string | null; modules: Module[]; note: string | null };

export type Programme = {
  slug: string;
  name: string;
  level: "bachelor" | "master";
  degree: string;
  duration: string;
  since: string | null;
  departmentKey: DepartmentKey | null;
  /** The department's full name, always shown instead of the key. */
  departmentName: string | null;
  /** The department's own page for this programme; null without a department. */
  departmentUrl: string | null;
  /** The programme document as a link (e.g. Google Drive)… */
  documentUrl: string | null;
  /** …and/or as an uploaded PDF (its /media URL). */
  documentFile: string | null;
  summary: string;
  outcomes: string[];
  structure: Structure;
  requirements: string[] | null;
  selectionNote: string | null;
  careers: string[] | null;
  facilities: { name: string; description: string }[] | null;
  /** Up to three photo URLs; with none, the hero shows placeholder frames. */
  images: string[];
};

/** The degree in short, for the hero: B.E., B.Arch, M.Eng, MSc Eng, or Master's. */
export function degreeShort({ degree }: Programme) {
  if (degree.startsWith("Bachelor of Arch")) return "B.Arch";
  if (degree.startsWith("Bachelor of Eng")) return "B.E.";
  if (degree.startsWith("Master of Engineering")) return "M.Eng";
  if (degree.startsWith("Master of Science")) return "MSc Eng";
  return "Master's";
}
