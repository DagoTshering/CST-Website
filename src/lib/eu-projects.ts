/**
 * The EU-funded projects on /eu-projects.
 *
 * The content lives in data/eu-projects.json, a copy of docs/reference/eu-projects.json: the
 * single source of truth, in the old page's order. Nothing on the page goes beyond it; where it
 * is null the page says so or leaves the block out.
 *
 * Some fields are notes for the web team, not page copy, and are never rendered: meta,
 * statusNote, summarySource, linkNote, coordinatorNote and oldUrl.
 *
 * linkState records what was found when each old link was opened on 18 October 2026: verified,
 * unchecked (kept; open it by hand, or run `pnpm check-links`), or unavailable (never linked).
 *
 * TODO(confirm) with the college: SSAPI's status (Completed here; the old list said Active);
 * what eAccess is and where it should link; Erasmus+ KA 171's description, partners and dates;
 * a CST-specific source for the two Uppsala ICM projects; SQUARES's coordinator (missing from its
 * partner table) and end date; addresses for the dead project websites; full titles, years and
 * summaries for the projects with none.
 */
import data from "../../data/eu-projects.json";

export type LinkState = "verified" | "unchecked" | "unavailable" | null;

export type ProjectDetail = {
  programme: string;
  projectNumber?: string;
  duration?: string;
  grant?: string;
  about: string;
  cstRole?: string;
  objectives?: string[];
  domains?: string[];
  outputs?: string[];
  coordinator?: string;
  /** A note for the web team; never rendered. */
  coordinatorNote?: string;
  /** [institution, country] */
  partners?: [string, string][];
  /** [name, role] */
  team?: [string, string][];
  /** [title, venue, dates] */
  meetings?: [string, string, string][];
  extraLinks?: { label: string; url: string }[];
};

export type Project = {
  slug: string;
  name: string;
  fullTitle: string | null;
  status: "active" | "completed";
  /** A note for the web team; never rendered. */
  statusNote?: string;
  summary: string | null;
  /** A note for the web team; never rendered. */
  summarySource?: string;
  /** accordion: details open in place; external: the row opens the project's website; none: a plain row. */
  page: "accordion" | "external" | "none";
  externalUrl: string | null;
  externalLabel?: string;
  linkState: LinkState;
  /** A note for the web team; never rendered. */
  linkNote?: string;
  /** The old site's address for the project; never rendered. */
  oldUrl?: string | null;
  detail?: ProjectDetail | null;
};

export const projects = data.projects as Project[];

export const STATUSES = [
  { status: "active", title: "Active projects" },
  { status: "completed", title: "Completed projects" },
] as const;

export const projectsWith = (status: Project["status"]) =>
  projects.filter((p) => p.status === status);

/**
 * The link a project's row or button may use. An unavailable link (a sold, parked or
 * compromised domain) is never returned, whatever the data says.
 */
export const safeUrl = (p: Project) =>
  p.linkState === "unavailable" ? null : (p.externalUrl ?? null);

/** The short facts above a project's details: only what the data gives. */
export function projectFacts(d: ProjectDetail): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  // the data's own wording, without its parenthetical asides
  if (d.duration) facts.push({ label: "Duration", value: d.duration.split("(")[0].trim() });
  if (d.programme)
    facts.push({ label: "Programme", value: d.programme.split(",")[0].split("(")[0].trim() });
  if (d.grant) facts.push({ label: "Grant", value: d.grant });
  if (d.partners?.length) {
    const countries = new Set(d.partners.map(([, country]) => country)).size;
    facts.push({
      label: "Partners",
      value: `${d.partners.length} institutions, ${countries} ${countries === 1 ? "country" : "countries"}`,
    });
  }
  return facts;
}

/** A project's partner institutions grouped by country, countries in order of first mention. */
export function partnersByCountry(partners: [string, string][]) {
  const byCountry = new Map<string, string[]>();
  for (const [institution, country] of partners) {
    byCountry.set(country, [...(byCountry.get(country) ?? []), institution]);
  }
  return [...byCountry].map(([country, institutions]) => ({ country, institutions }));
}
