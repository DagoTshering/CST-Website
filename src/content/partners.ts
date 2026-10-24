/**
 * The Partners page (/about/partners): the type its components share, the groups the partners
 * are listed in, and helpers.
 *
 * The partners are managed in the admin panel (Admin › Partners) and read from the database
 * (src/lib/cms/resources/partners.ts). They were seeded from data/partners.json, merged from the
 * college presentation.
 */
export type PartnerCategory = "international" | "national";

export type PartnerType =
  "university" | "research" | "government" | "industry" | "foundation" | "programme" | "finance";

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  type: PartnerType;
  city: string | null;
  country: string;
  note: string | null;
  websiteUrl: string | null;
  /** The logo's URL, or null to show the partner's initials. */
  logo: string | null;
};

export type PartnerGroup = { id: string; title: string; partners: Partner[] };

/** National partners are listed by type, in this order; a type not named here comes last. */
const NATIONAL_GROUPS: { type: PartnerType; title: string }[] = [
  { type: "government", title: "Government and agencies" },
  { type: "industry", title: "Industry and corporations" },
  { type: "finance", title: "Banks" },
  { type: "foundation", title: "Foundations and trusts" },
  { type: "university", title: "Universities" },
  { type: "research", title: "Research institutes" },
  { type: "programme", title: "Programmes" },
];

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * A category's partners in their accordion groups: international ones by country
 * (alphabetical), national ones by type (in NATIONAL_GROUPS' order). Partners keep their display
 * order within a group.
 */
export function groupPartners(partners: Partner[], category: PartnerCategory): PartnerGroup[] {
  const inCategory = partners.filter((p) => p.category === category);
  if (category === "international") {
    const countries = [...new Set(inCategory.map((p) => p.country))].sort((a, b) =>
      a.localeCompare(b, "en"),
    );
    return countries.map((country) => ({
      id: slug(country),
      title: country,
      partners: inCategory.filter((p) => p.country === country),
    }));
  }
  return NATIONAL_GROUPS.map(({ type, title }) => ({
    id: type,
    title,
    partners: inCategory.filter((p) => p.type === type),
  })).filter((group) => group.partners.length > 0);
}

/** The four figures under the title. Countries are the international partners' countries. */
export function partnerFigures(partners: Partner[]) {
  const international = partners.filter((p) => p.category === "international");
  return {
    international: international.length,
    national: partners.length - international.length,
    countries: new Set(international.map((p) => p.country)).size,
    universities: partners.filter((p) => p.type === "university").length,
  };
}

const MINOR_WORDS = /^(of|and|the|for|de|del|degli|di|studi)$/i;

/**
 * Up to three letters for a partner without a logo: the acronym the name ends with
 * ("International Solar Alliance (ISA)" -> "ISA"), else the first and last words' initials
 * ("Indian Institute of Technology Bombay" -> "IB"), or a single word's first two letters.
 */
export function partnerInitials(name: string) {
  const acronym = name.match(/\(([A-Z]{2,5})\)/);
  if (acronym) return acronym[1].slice(0, 3);
  const words = name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !MINOR_WORDS.test(word));
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? words[words.length - 1][0] : (words[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

/** Every word of the query must appear in the partner's name, city, country or type. */
export function matchesPartner(partner: Partner, query: string, groupTitle: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [partner.name, partner.city ?? "", partner.country, partner.type, groupTitle]
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export const partnersLabel = (n: number) => `${n} ${n === 1 ? "partner" : "partners"}`;
