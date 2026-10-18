/**
 * The staff directory (/about/staff-directory): the types its components share, and helpers.
 *
 * The departments and people are managed in the admin panel (Admin › Staff) and read from the
 * database (src/lib/cms/resources/staff.ts). They were seeded from data/people/staff.json, a copy
 * of the original export (docs/reference/staff.json) with these corrections, confirmed by the
 * college in October 2026: Phub Dem's email (it lacked ".edu.bt"), Thinley Wangmo's email (a JNEC
 * address) and Phurpa Zangmo's name (it read "Purpa"). The seven support staff without an email
 * (cooks, gardeners, the water fitter) are shown without one.
 */
export type DepartmentKey = string;

export type Department = {
  /** The department's short code, e.g. "CEED". */
  key: DepartmentKey;
  label: string;
  group: "Department" | "Administration";
};

export type StaffMember = {
  /** Unique and stable: always key on it (names are not unique). */
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
  /** The department's code. */
  department: DepartmentKey;
  departmentLabel: string;
  email: string | null;
  /** The photo's URL, or null to show the person's initials. */
  image: string | null;
};

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

/**
 * Whether the person matches a search: every word of the query must appear somewhere in their
 * name, designation, department or email.
 */
export function matchesQuery(person: StaffMember, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [person.name, person.designation, person.departmentLabel, person.email ?? ""]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}
