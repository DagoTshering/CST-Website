import "server-only";

import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import type { Partner } from "@/content/partners";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import type { PartnerCategory, PartnerType } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media/url";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import { optionalMediaId, optionalText, optionalUrl, requiredText, status } from "../validation";
import { asField, loadPreview, mediaColumns, toPreview } from "./shared";

const { media, partners } = schema;

export const PARTNERS_TAG = "cms:partners";

export const PARTNER_CATEGORIES = [
  { value: "international", label: "International" },
  { value: "national", label: "National" },
] as const satisfies readonly { value: PartnerCategory; label: string }[];

export const PARTNER_TYPES = [
  { value: "university", label: "University" },
  { value: "research", label: "Research" },
  { value: "government", label: "Government" },
  { value: "industry", label: "Industry" },
  { value: "foundation", label: "Foundation" },
  { value: "programme", label: "Programme" },
  { value: "finance", label: "Finance" },
] as const satisfies readonly { value: PartnerType; label: string }[];

const categoryLabel = new Map<string, string>(PARTNER_CATEGORIES.map((c) => [c.value, c.label]));
const typeLabel = new Map<string, string>(PARTNER_TYPES.map((t) => [t.value, t.label]));

const partnerSchema = z.object({
  name: requiredText("Name", 200),
  category: z.enum(["international", "national"], { error: "Choose international or national." }),
  type: z.enum(
    ["university", "research", "government", "industry", "foundation", "programme", "finance"],
    {
      error: "Choose a type.",
    },
  ),
  city: optionalText("City", 120),
  country: requiredText("Country", 120),
  note: optionalText("Note", 200),
  websiteUrl: optionalUrl("Website"),
  logoId: optionalMediaId,
  status,
});

type PartnerInput = z.output<typeof partnerSchema>;

export const partnerFields: FieldDef[] = [
  { kind: "text", name: "name", label: "Name", required: true, maxLength: 200 },
  {
    kind: "select",
    name: "category",
    label: "Category",
    required: true,
    width: "half",
    options: PARTNER_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    help: "International partners are listed by country, national ones by type.",
  },
  {
    kind: "select",
    name: "type",
    label: "Type",
    required: true,
    width: "half",
    options: PARTNER_TYPES.map((t) => ({ value: t.value, label: t.label })),
  },
  { kind: "text", name: "city", label: "City", maxLength: 120, width: "half" },
  {
    kind: "text",
    name: "country",
    label: "Country",
    required: true,
    maxLength: 120,
    width: "half",
    help: "Spelled the same way for every partner in that country: they are grouped by it.",
  },
  {
    kind: "text",
    name: "note",
    label: "Note",
    maxLength: 200,
    help: "Optional, shown after the city, e.g. “through the Obel Foundation”.",
  },
  {
    kind: "text",
    name: "websiteUrl",
    label: "Website",
    maxLength: 500,
    placeholder: "https://",
    help: "Optional. The partner’s card links to it, in a new tab.",
  },
  {
    kind: "image",
    name: "logoId",
    label: "Logo",
    help: "PNG (ideally with a transparent background), JPEG or WebP. Without one, the partner’s initials are shown.",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const partnerResource: ResourceDef<PartnerInput> = {
  singular: "partner",
  basePath: "/admin/partners",
  tag: PARTNERS_TAG,
  schema: partnerSchema,
  ordering: { key: "partners", group: (data) => data.category },
  media: (data) => [{ field: "logoId", id: data.logoId, kind: "image" }],
  create: async (tx, data) =>
    (await tx.insert(partners).values(data).returning({ id: partners.id }))[0].id,
  update: async (tx, id, data) =>
    (await tx.update(partners).set(data).where(eq(partners.id, id)).returning({ id: partners.id }))
      .length > 0,
  remove: async (tx, id) =>
    (await tx.delete(partners).where(eq(partners.id, id)).returning({ id: partners.id })).length >
    0,
};

/** Partners for the admin list, optionally in one category or matching a search. */
export async function listPartners(filter: { category?: PartnerCategory; query?: string } = {}) {
  await requireAdmin();
  const conditions: SQL[] = [];
  if (filter.category) conditions.push(eq(partners.category, filter.category));
  const words = (filter.query ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
  for (const word of words) {
    const like = `%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(ilike(partners.name, like), ilike(partners.city, like), ilike(partners.country, like))!,
    );
  }
  const rows = await getDb()
    .select({
      id: partners.id,
      name: partners.name,
      category: partners.category,
      type: partners.type,
      city: partners.city,
      country: partners.country,
      status: partners.status,
      updatedAt: partners.updatedAt,
      logo: mediaColumns,
    })
    .from(partners)
    .leftJoin(media, eq(media.id, partners.logoId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(partners.category), asc(partners.sortOrder), asc(partners.name));
  return rows.map(({ logo, ...row }) => ({
    ...row,
    categoryLabel: categoryLabel.get(row.category) ?? row.category,
    typeLabel: typeLabel.get(row.type) ?? row.type,
    place: [row.city, row.country].filter(Boolean).join(", "),
    image: logo ? toPreview(logo) : null,
  }));
}

export async function countPartners() {
  await requireAdmin();
  const [{ n }] = await getDb().select({ n: count() }).from(partners);
  return n;
}

export async function getPartnerForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb().select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      category: row.category,
      type: row.type,
      city: asField(row.city),
      country: row.country,
      note: asField(row.note),
      websiteUrl: asField(row.websiteUrl),
      logoId: asField(row.logoId),
      status: row.status,
    },
    media: { logoId: await loadPreview(row.logoId) },
  };
}

/** Published partners for the Partners page, in display order within each category. */
export async function getPublishedPartners(): Promise<Partner[]> {
  "use cache";
  cacheTag(PARTNERS_TAG);
  cacheLife("hours");

  const rows = await getDb()
    .select({
      id: partners.id,
      name: partners.name,
      category: partners.category,
      type: partners.type,
      city: partners.city,
      country: partners.country,
      note: partners.note,
      websiteUrl: partners.websiteUrl,
      logoKey: media.storageKey,
    })
    .from(partners)
    .leftJoin(media, eq(media.id, partners.logoId))
    .where(eq(partners.status, "published"))
    .orderBy(asc(partners.category), asc(partners.sortOrder), asc(partners.name));

  return rows.map(({ logoKey, ...row }) => ({
    ...row,
    id: String(row.id),
    logo: logoKey ? mediaUrl(logoKey) : null,
  }));
}
