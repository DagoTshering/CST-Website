import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import t from "@/components/ui/Tabs.module.css";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedVacancies } from "@/lib/cms/resources/vacancies";
import { cx } from "@/lib/cx";
import { formatVacancyDate, VACANCY_CATEGORIES, vacancyCategoryLabel } from "@/lib/vacancies";

export const metadata: Metadata = {
  title: "Vacancies",
  description: `Job vacancies and recruitment notices of the ${site.name}, ${site.university}: advertisements, shortlists, interview and examination schedules, results and final selections.`,
};

type Props = PageProps<"/vacancies">;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/** The listing's address for a category (by its short name) and page. */
function hrefFor(param: string | null, page = 1) {
  const search = new URLSearchParams();
  if (param) search.set("category", param);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return `/vacancies${query ? `?${query}` : ""}`;
}

/**
 * The posts of the category and page in the address, read from the database (Admin ›
 * Vacancies) at request time through a cached query the admin panel refreshes on every change.
 */
async function Listing({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const category = VACANCY_CATEGORIES.find((c) => c.param === one(params.category)) ?? null;
  const requested = Number(one(params.page) || "1");
  const page = Number.isInteger(requested) && requested >= 1 && requested <= 1000 ? requested : 1;

  const result = await loadPublished("vacancies", () =>
    getPublishedVacancies(category?.value ?? null, page),
  );
  if (!result.ok) {
    return (
      <p className="py-16 text-copy">
        The vacancies cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  const { items, total, pages, counts } = result.data;
  const all = Object.values(counts).reduce((n, c) => n + (c ?? 0), 0);

  return (
    <>
      {all > 0 && (
        <nav aria-label="Recruitment category" className={cx(t.tabs, "justify-start")}>
          <Link
            href={hrefFor(null)}
            className={t.tab}
            aria-current={category ? undefined : "page"}
            scroll={false}
          >
            All <span className={t.count}>{all}</span>
          </Link>
          {VACANCY_CATEGORIES.filter((c) => counts[c.value] || c === category).map((c) => (
            <Link
              key={c.value}
              href={hrefFor(c.param)}
              className={t.tab}
              aria-current={c === category ? "page" : undefined}
              scroll={false}
            >
              {c.plural} <span className={t.count}>{counts[c.value] ?? 0}</span>
            </Link>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-copy">
          {all === 0 ? (
            <p>
              There are no vacancies or recruitment notices at the moment. Please check back later.
            </p>
          ) : (
            <p>
              There is nothing here{" "}
              {category ? `under ${category.plural.toLowerCase()}` : "on this page"}.{" "}
              <Link href={hrefFor(null)} className="font-semibold text-primary-strong underline">
                See all recruitment notices
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <ol
          className="mt-4 border-t border-line"
          aria-label={category?.plural ?? "Recruitment notices"}
        >
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/vacancies/${item.slug}`}
                className="group grid gap-x-8 gap-y-2 border-b border-line py-6 transition-colors hover:border-primary sm:grid-cols-[8.5rem_1fr_auto] sm:items-start"
              >
                <span className="font-mono text-xs tracking-[0.06em] text-muted sm:pt-1.5">
                  <time dateTime={item.publishedAt.toISOString()}>
                    {formatVacancyDate(item.publishedAt)}
                  </time>
                </span>
                <span className="min-w-0">
                  <span className="eyebrow flex items-center gap-2 text-primary-strong">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full bg-[#34acc8]"
                    />
                    {vacancyCategoryLabel(item.category)}
                    {item.hasAttachment && (
                      <span className="text-muted">
                        · <span className="sr-only">with a </span>PDF
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-colors group-hover:text-primary-strong">
                    {item.title}
                  </span>
                  {item.excerpt && (
                    <span className="mt-2 block max-w-[46em] text-small leading-relaxed text-copy">
                      {item.excerpt}
                    </span>
                  )}
                </span>
                <span className="hidden text-muted transition-colors group-hover:text-primary-strong sm:block sm:pt-1.5">
                  {item.hasAttachment ? (
                    <FileText className="size-5" aria-hidden="true" />
                  ) : (
                    <ArrowRightIcon className="size-5" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center gap-2">
          {page > 1 && (
            <Link
              href={hrefFor(category?.param ?? null, page - 1)}
              className="px-3 py-2 font-display text-sm font-semibold text-primary-strong"
            >
              ← Newer
            </Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={hrefFor(category?.param ?? null, n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={cx(
                "inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm border font-mono text-sm",
                n === page
                  ? "border-primary-strong bg-primary-strong text-white"
                  : "border-line text-ink hover:border-primary-strong",
              )}
            >
              {n}
            </Link>
          ))}
          {page < pages && (
            <Link
              href={hrefFor(category?.param ?? null, page + 1)}
              className="px-3 py-2 font-display text-sm font-semibold text-primary-strong"
            >
              Older →
            </Link>
          )}
          <span className="ml-auto text-small text-muted">
            {total} {total === 1 ? "notice" : "notices"}
          </span>
        </nav>
      )}
    </>
  );
}

export default function VacanciesPage({ searchParams }: Props) {
  return (
    <div className="bg-white">
      <PageHeader
        title="Vacancies"
        intro="Job vacancies and recruitment notices: advertisements, shortlists, interview and examination schedules, results and final selections."
      />
      <div className="container-page pt-4 pb-[clamp(4rem,3rem+3vw,6.5rem)]">
        <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
          <Listing searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
