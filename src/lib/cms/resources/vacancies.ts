import "server-only";

import { and, asc, count, desc, eq, ilike, ne, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";
import { excerptOf, plainText, sanitizeDocument, type RichNode } from "@/lib/rich-text";
import { slugify, VACANCY_CATEGORIES, type VacancyCategory } from "@/lib/vacancies";

import type { ResourceDef, Tx } from "../crud";
import type { FormInitial } from "../form";
import { optionalMediaId, optionalText, requiredText } from "../validation";
import { loadPreview } from "./shared";

/*
 * The Vacancies page (/vacancies and /vacancies/<slug>): job recruitment notices, each a rich-text
 * document with an optional PDF. Separate from the homepage's announcements (announcements.ts),
 * which are general college notices.
 */

const { media, vacancies, vacancySlugRedirects } = schema;

export const VACANCIES_TAG = "cms:vacancies";

/** Posts per page of the public listing. */
export const VACANCIES_PAGE_SIZE = 10;

const CATEGORY_VALUES = VACANCY_CATEGORIES.map((c) => c.value) as [
  VacancyCategory,
  ...VacancyCategory[],
];

/** What each button of the form does to the post's state. */
const INTENTS = {
  draft: "draft",
  publish: "published",
  update: "published",
  unpublish: "draft",
} as const;

const vacancySchema = z
  .object({
    title: requiredText("Title", 300),
    category: z.enum(CATEGORY_VALUES, { error: "Choose a recruitment category." }),
    slug: optionalText("Web address", 160).pipe(
      z
        .string()
        .regex(
          /^[a-z0-9]+(-[a-z0-9]+)*$/,
          "Use lower-case letters, digits and hyphens, e.g. lecturer-shortlist-2026.",
        )
        .nullable(),
    ),
    // the editor's document, as JSON in a hidden field
    content: z
      .string({ error: "The content could not be read. Reload the page and try again." })
      .max(2_000_000, "The content is too long.")
      .transform((value, ctx) => {
        let doc: RichNode | null = null;
        try {
          doc = sanitizeDocument(JSON.parse(value));
        } catch {
          doc = null;
        }
        if (!doc) {
          ctx.addIssue({
            code: "custom",
            message: "The content could not be read, or is too long.",
          });
          return z.NEVER;
        }
        return doc;
      }),
    attachmentId: optionalMediaId,
    intent: z.enum(["draft", "publish", "update", "unpublish"], {
      error: "Choose Save draft or Publish.",
    }),
  })
  .superRefine((data, ctx) => {
    if (
      data.intent !== "draft" &&
      data.intent !== "unpublish" &&
      !plainText(data.content) &&
      !data.attachmentId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Write the notice, or attach its PDF, before publishing.",
      });
    }
  })
  .transform(({ intent, content, ...data }) => ({
    ...data,
    content,
    excerpt: excerptOf(content),
    status: INTENTS[intent],
  }));

type VacancyInput = z.output<typeof vacancySchema>;

/** A free web address from `base`: base, base-2, base-3… (skipping the post's own). */
async function freeSlug(tx: Tx, base: string, exceptId: number | null) {
  const root = base || "vacancy";
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? root : `${root.slice(0, 150)}-${n}`;
    const [taken] = await tx
      .select({ id: vacancies.id })
      .from(vacancies)
      .where(
        exceptId === null
          ? eq(vacancies.slug, slug)
          : and(eq(vacancies.slug, slug), ne(vacancies.id, exceptId)),
      )
      .limit(1);
    if (!taken) return slug;
  }
  return `${root.slice(0, 140)}-${Date.now().toString(36)}`;
}

export const vacancyResource: ResourceDef<VacancyInput> = {
  singular: "vacancy post",
  basePath: "/admin/vacancies",
  tag: VACANCIES_TAG,
  schema: vacancySchema,
  media: (data) => [{ field: "attachmentId", id: data.attachmentId, kind: "document" }],
  validate: async (tx, data, id) => {
    // an address typed in must be free; one left empty is made from the title
    if (!data.slug) return null;
    const [taken] = await tx
      .select({ id: vacancies.id })
      .from(vacancies)
      .where(eq(vacancies.slug, data.slug))
      .limit(1);
    return taken && taken.id !== id
      ? { slug: ["Another post has this web address. Choose another."] }
      : null;
  },
  create: async (tx, { slug, ...data }) => {
    const address = slug ?? (await freeSlug(tx, slugify(data.title), null));
    // an address another post used to have now belongs to this one
    await tx.delete(vacancySlugRedirects).where(eq(vacancySlugRedirects.slug, address));
    return (
      await tx
        .insert(vacancies)
        .values({
          ...data,
          slug: address,
          publishedAt: data.status === "published" ? sql`now()` : null,
        })
        .returning({ id: vacancies.id })
    )[0].id;
  },
  update: async (tx, id, { slug, ...data }) => {
    const [current] = await tx
      .select({ slug: vacancies.slug })
      .from(vacancies)
      .where(eq(vacancies.id, id))
      .limit(1);
    if (!current) return false;
    const address = slug ?? (await freeSlug(tx, slugify(data.title), id));
    if (address !== current.slug) {
      // the new address no longer redirects anywhere; the old one now redirects here
      await tx.delete(vacancySlugRedirects).where(eq(vacancySlugRedirects.slug, address));
      await tx
        .insert(vacancySlugRedirects)
        .values({ slug: current.slug, vacancyId: id })
        .onConflictDoUpdate({ target: vacancySlugRedirects.slug, set: { vacancyId: id } });
    }
    await tx
      .update(vacancies)
      .set({
        ...data,
        slug: address,
        // first published now, or keep the date it was first published
        publishedAt:
          data.status === "published"
            ? sql`coalesce(${vacancies.publishedAt}, now())`
            : sql`${vacancies.publishedAt}`,
      })
      .where(eq(vacancies.id, id));
    return true;
  },
  remove: async (tx, id) =>
    (await tx.delete(vacancies).where(eq(vacancies.id, id)).returning({ id: vacancies.id }))
      .length > 0,
};

// ---------------------------------------------------------------------------- admin

/** The posts for the admin list: newest first, searched by title, filtered by category or state. */
export async function listVacancies(filter: {
  query?: string;
  category?: string;
  status?: string;
}) {
  await requireAdmin();
  const where: SQL[] = [];
  const query = filter.query?.trim().slice(0, 100);
  if (query) where.push(ilike(vacancies.title, `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`));
  if (CATEGORY_VALUES.includes(filter.category as VacancyCategory)) {
    where.push(eq(vacancies.category, filter.category as VacancyCategory));
  }
  if (filter.status === "draft" || filter.status === "published") {
    where.push(eq(vacancies.status, filter.status));
  }
  return getDb()
    .select({
      id: vacancies.id,
      title: vacancies.title,
      slug: vacancies.slug,
      category: vacancies.category,
      status: vacancies.status,
      publishedAt: vacancies.publishedAt,
      updatedAt: vacancies.updatedAt,
      hasAttachment: sql<boolean>`${vacancies.attachmentId} is not null`,
    })
    .from(vacancies)
    .where(where.length > 0 ? and(...where) : undefined)
    .orderBy(desc(vacancies.updatedAt), desc(vacancies.id));
}

export async function countVacancies() {
  await requireAdmin();
  const [{ n }] = await getDb().select({ n: count() }).from(vacancies);
  return n;
}

export type VacancyForm = FormInitial & {
  /** Earlier addresses that redirect to this post. */
  oldSlugs: string[];
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date;
  slug: string;
  content: RichNode;
};

export async function getVacancyForm(id: number): Promise<VacancyForm | null> {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select().from(vacancies).where(eq(vacancies.id, id)).limit(1);
  if (!row) return null;
  const old = await db
    .select({ slug: vacancySlugRedirects.slug })
    .from(vacancySlugRedirects)
    .where(eq(vacancySlugRedirects.vacancyId, id))
    .orderBy(desc(vacancySlugRedirects.createdAt));
  return {
    oldSlugs: old.map((o) => o.slug),
    values: { title: row.title, category: row.category, slug: row.slug },
    media: { attachmentId: await loadPreview(row.attachmentId) },
    content: (sanitizeDocument(row.content) ?? { type: "doc", content: [] }) as RichNode,
    status: row.status,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    slug: row.slug,
  };
}

// ---------------------------------------------------------------------------- public

const published = eq(vacancies.status, "published");

/** A page of the published posts, newest first, of one category or all. */
export async function getPublishedVacancies(category: VacancyCategory | null, page: number) {
  "use cache";
  cacheTag(VACANCIES_TAG);
  cacheLife("hours");

  const where = category ? and(published, eq(vacancies.category, category)) : published;
  const db = getDb();
  const [items, [{ total }], counts] = await Promise.all([
    db
      .select({
        title: vacancies.title,
        slug: vacancies.slug,
        category: vacancies.category,
        excerpt: vacancies.excerpt,
        publishedAt: vacancies.publishedAt,
        hasAttachment: sql<boolean>`${vacancies.attachmentId} is not null`,
      })
      .from(vacancies)
      .where(where)
      .orderBy(desc(vacancies.publishedAt), desc(vacancies.id))
      .limit(VACANCIES_PAGE_SIZE)
      .offset((page - 1) * VACANCIES_PAGE_SIZE),
    db.select({ total: count() }).from(vacancies).where(where),
    // how many each category has, for the category links
    db
      .select({ category: vacancies.category, n: count() })
      .from(vacancies)
      .where(published)
      .groupBy(vacancies.category)
      .orderBy(asc(vacancies.category)),
  ]);
  return {
    items: items.map((item) => ({ ...item, publishedAt: item.publishedAt! })),
    total,
    pages: Math.max(1, Math.ceil(total / VACANCIES_PAGE_SIZE)),
    counts: Object.fromEntries(counts.map((c) => [c.category, c.n])) as Partial<
      Record<VacancyCategory, number>
    >,
  };
}

/** A published post by its web address, or null. */
export async function getPublishedVacancy(slug: string) {
  "use cache";
  cacheTag(VACANCIES_TAG);
  cacheLife("hours");

  const [row] = await getDb()
    .select({
      title: vacancies.title,
      slug: vacancies.slug,
      category: vacancies.category,
      content: vacancies.content,
      excerpt: vacancies.excerpt,
      publishedAt: vacancies.publishedAt,
      updatedAt: vacancies.updatedAt,
      attachment: { storageKey: media.storageKey, name: media.originalName, size: media.byteSize },
    })
    .from(vacancies)
    .leftJoin(media, eq(media.id, vacancies.attachmentId))
    .where(and(published, eq(vacancies.slug, slug)))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    publishedAt: row.publishedAt!,
    // stored sanitised; sanitised again in case the stored document was changed by hand
    content: sanitizeDocument(row.content) ?? { type: "doc", content: [] },
    attachment: row.attachment?.storageKey
      ? {
          url: mediaUrl(row.attachment.storageKey),
          name: row.attachment.name,
          size: row.attachment.size,
        }
      : null,
  };
}

/** A post as it is saved, draft or published, for the admin's preview page (never cached). */
export async function getVacancyPreview(id: number) {
  await requireAdmin();
  const [row] = await getDb()
    .select({
      title: vacancies.title,
      slug: vacancies.slug,
      category: vacancies.category,
      content: vacancies.content,
      status: vacancies.status,
      publishedAt: vacancies.publishedAt,
      updatedAt: vacancies.updatedAt,
      attachment: { storageKey: media.storageKey, name: media.originalName, size: media.byteSize },
    })
    .from(vacancies)
    .leftJoin(media, eq(media.id, vacancies.attachmentId))
    .where(eq(vacancies.id, id))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    content: sanitizeDocument(row.content) ?? { type: "doc", content: [] },
    attachment: row.attachment?.storageKey
      ? {
          url: mediaUrl(row.attachment.storageKey),
          name: row.attachment.name,
          size: row.attachment.size,
        }
      : null,
  };
}
