/**
 * The Programmes section (/programmes and /programmes/[slug]).
 *
 * The content lives in programmes.json, a copy of docs/reference/programmes.json: the single
 * source of truth, kept in one place so a future admin panel can edit it. Nothing on the pages
 * goes beyond it; where it is null or unconfirmed, the pages say so plainly.
 *
 * Each programme's departmental link (departmentUrl) and programme document (documentUrl) is one
 * field, so when the department sites are retired a single edit per programme (or pointing
 * departmentUrl at the main site) updates every link to it.
 *
 * Known caveats, to confirm with the college (see also the TODO(confirm) notes below):
 * - TODO(confirm): Electrical, Electronics and Communication, and Instrumentation and Control are
 *   assumed to belong to EEED, and Mechanical to MED.
 * - TODO(confirm): Renewable Energy and the MSc in Engineering name no department; their closing
 *   block links to their own pages on cst.edu.bt.
 * - TODO(confirm): "CTD" is shown as "Computing Technologies Department", the name used by the
 *   staff directory. Confirm the exact name.
 * - TODO(confirm): the IT department page asks for 50% in Mathematics and English only; the
 *   central admission page asks for 50% in Physics, Chemistry, Mathematics and English. The data
 *   follows the central page. Software Engineering has the same difference.
 * - TODO(confirm): Engineering Geology and Instrumentation and Control say "Since July 2019";
 *   Software Engineering, Mechanical and Water Resource "Since July 2023". The old pages do not
 *   say whether that is the launch or the first intake.
 * - TODO(confirm): master's durations are from the old pages: Renewable Energy and Construction
 *   Management 18 months, the MSc in Engineering 24 months. (A stray "four-year mechanical
 *   engineering" sentence on the Construction Management page was not copied.)
 * - TODO(confirm): Architecture and Software Engineering have no programme document. The other
 *   documentUrl values were read from the old site's "More Details" buttons; check each loads.
 * - TODO(confirm): module descriptions with descriptionSource "draft" were written as neutral
 *   summaries for the prototype, not published by the college. They stay in the data so each
 *   department can check and replace them; do not present them as official syllabus text.
 * - Electrical, Renewable Energy, the MSc in Engineering and Instrumentation and Control publish
 *   their module lists only in their programme documents (structure.kind "none").
 */
import data from "./programmes.json";

/** The programme sites' department keys. The staff directory uses its own: see STAFF_DEPARTMENT. */
export type DepartmentKey = "AD" | "CEED" | "EEED" | "MED" | "CTD";

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
  /** The department's own page for this programme (or, with no department, the programme's). */
  departmentUrl: string;
  /** The programme document (Google Drive). */
  documentUrl: string | null;
  summary: string;
  outcomes: string[];
  structure: Structure;
  /**
   * IT, Software Engineering and Mechanical only: the module list by year and semester. Not
   * displayed (the pages show the same selected modules for every programme); kept so the data
   * is not lost.
   */
  fullCurriculum?: {
    label: string;
    semesters: { title: string; modules: { code: string | null; name: string }[] }[];
  }[];
  requirements: string[] | null;
  selectionNote: string | null;
  careers: string[] | null;
  facilities: { name: string; description: string }[] | null;
  /** Paths under /public, added by hand; empty until then (the hero shows placeholder frames). */
  images: string[];
};

const programmes = data.programmes as Programme[];

/** The documents every bachelor's applicant needs (the central admission page). */
export const requiredDocuments: string = data.requiredDocuments;

/** The admission page (src/content/admission.ts), for dates and how to apply. */
export const ADMISSION_URL = "/admissions";

/** The departments as the programme sites name them. */
export const departments = data.departments as Record<DepartmentKey, { n: string; u: string }>;

/**
 * The same departments in the staff directory (src/content/staff.json), which uses its own keys,
 * so the two can be linked without duplicating names.
 */
export const STAFF_DEPARTMENT: Record<DepartmentKey, string> = {
  AD: "ARCH",
  CEED: "CEED",
  EEED: "EEED",
  MED: "MECH",
  CTD: "CTD",
};

export const getAllProgrammes = () => programmes;

export const getProgramme = (slug: string) => programmes.find((p) => p.slug === slug);

export const bachelorProgrammes = () => programmes.filter((p) => p.level === "bachelor");

export const masterProgrammes = () => programmes.filter((p) => p.level === "master");

/** The degree in short, for the hero: B.E., B.Arch, M.Eng, MSc Eng, or Master's. */
export function degreeShort({ degree }: Programme) {
  if (degree.startsWith("Bachelor of Arch")) return "B.Arch";
  if (degree.startsWith("Bachelor of Eng")) return "B.E.";
  if (degree.startsWith("Master of Engineering")) return "M.Eng";
  if (degree.startsWith("Master of Science")) return "MSc Eng";
  return "Master's";
}
