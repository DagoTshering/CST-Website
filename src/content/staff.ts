/**
 * The staff directory (/about/staff-directory): departments and people.
 *
 * The data lives in staff.json, a copy of docs/reference/staff.json (the original export, left
 * untouched) whose `image` paths point at public/images/staff/ (see
 * scripts/download-staff-photos.mjs). Keep it in that one file so a future admin panel can edit
 * it. Names are not unique (there are two Nima Yoezers, two Tsherings, ...): always key on `id`.
 *
 * Corrected from the export, as confirmed by the college in October 2026: Phub Dem's email
 * (it lacked ".edu.bt"), Thinley Wangmo's email (a JNEC address; her id keeps the old name, as
 * her photo is filed under it) and Phurpa Zangmo's name (it read "Purpa"). The seven support
 * staff without an email (cooks, gardeners, the water fitter) are shown without one.
 */
import data from "./staff.json";

export type DepartmentKey =
  "CEED" | "EEED" | "CTD" | "ARCH" | "MECH" | "SHD" | "ADM" | "FIN" | "ICT" | "LIB" | "EST";

export type Department = {
  key: DepartmentKey;
  label: string;
  group: "Department" | "Administration";
};

export type StaffMember = {
  /** Unique and stable (it names the photo file); mostly the person's email name. */
  id: string;
  name: string;
  /** As written on the old site, e.g. "Assistant Professor/HoD CEED/PL (Civil)". */
  designation: string;
  rank: string;
  /** Expanded from `tags`, e.g. "Head of Department". */
  roles: string[];
  /** e.g. "HoD", "PL", "DAA". */
  tags: string[];
  programmes: string[];
  department: DepartmentKey;
  email: string | null;
  /** A path under /images/staff, or null to show the person's initials. */
  image: string | null;
};

export const departments = data.departments as Department[];
export const staff = data.staff as StaffMember[];

const labels = new Map(departments.map((d) => [d.key, d.label]));

export const departmentLabel = (key: DepartmentKey) => labels.get(key) ?? key;

/** Two initials for a portrait placeholder, ignoring a title: "Dr. Cheki Dorji" -> "CD". */
export function initials(name: string) {
  const parts = name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** The person's programmes, without one that only repeats the department's name. */
export const visibleProgrammes = (person: StaffMember) => {
  const department = departmentLabel(person.department).toLowerCase();
  return person.programmes.filter((p) => p.toLowerCase() !== department);
};

/**
 * Whether the person matches a search: every word of the query must appear somewhere in their
 * name, designation, department or email.
 */
export function matchesQuery(person: StaffMember, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [
    person.name,
    person.designation,
    departmentLabel(person.department),
    person.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}
