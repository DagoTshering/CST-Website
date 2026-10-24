import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import s from "@/components/announcements/NoticeBoard.module.css";
import { NoticeCard } from "@/components/announcements/NoticeCard";
import { NoticeTicker } from "@/components/announcements/NoticeTicker";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { formatDate } from "@/lib/dates";
import { pageLinks } from "@/lib/pagination";
import { bhutanToday } from "@/lib/admission";
import { loadPublished } from "@/lib/cms/public";
import { getAnnouncementsPage } from "@/lib/cms/resources/announcements";

const INTRO =
  "Notices from the college: examinations, admissions, events, offices and everything else students, staff and visitors need to know. Job recruitment notices are under Vacancies.";

export const metadata: Metadata = {
  title: "Announcements",
  description: `Notices from the ${site.name}, ${site.university}: examinations, admissions, events, offices and more.`,
};

type Props = PageProps<"/announcements">;

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const hrefFor = (page: number) => (page > 1 ? `/announcements?page=${page}` : "/announcements");

/** Days from `from` to `to` (both YYYY-MM-DD). */
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * The board: the notices of the page in the address, read from the database
 * (Admin › Announcements) at request time through a cached query refreshed on every change.
 */
async function Board({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const requested = Number(one(params.page) || "1");
  const page = Number.isInteger(requested) && requested >= 1 && requested <= 1000 ? requested : 1;

  const result = await loadPublished("announcements page", () => getAnnouncementsPage(page));
  if (!result.ok) {
    return (
      <>
        <div className={`container-page ${s.board}`}>
          <p className={s.empty}>
            The announcements cannot be shown at the moment. Please try again later.
          </p>
        </div>
      </>
    );
  }
  const { items, pages, latest, all } = result.data;
  const today = bhutanToday();
  const [first, ...rest] = page === 1 ? items : [null, ...items];

  return (
    <>
      {all > 0 && (
        <p className={`text-center ${s.count}`}>
          {all} {all === 1 ? "notice" : "notices"}
          {latest[0] && ` · latest ${formatDate(latest[0].publishedOn)}`}
        </p>
      )}
      <div className="mt-[clamp(1.25rem,1rem+1vw,2rem)]">
        <NoticeTicker latest={latest} />
      </div>
      <section aria-label="Notices" className={s.board}>
        <div className="container-page">
          {items.length === 0 ? (
            <p className={s.empty}>
              {all === 0 ? (
                "There are no announcements at the moment. Please check back soon."
              ) : (
                <>
                  Nothing here.{" "}
                  <Link href={hrefFor(1)} className="font-semibold text-primary-strong underline">
                    See all announcements
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <>
              {first && (
                <NoticeCard
                  notice={first}
                  featured
                  isNew={daysBetween(first.publishedOn, today) <= 7}
                />
              )}
              {rest.length > 0 && (
                <ul className={s.notes}>
                  {rest.map((notice, i) =>
                    notice ? (
                      <li key={notice.slug}>
                        <NoticeCard notice={notice} delay={(i % 3) * 120} />
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </>
          )}

          {pages > 1 && (
            <nav aria-label="Pages" className={s.pager}>
              {page > 1 && (
                <Link href={hrefFor(page - 1)} className={s.pageLink}>
                  ← Newer
                </Link>
              )}
              <span className="sr-only">
                Page {page} of {pages}
              </span>
              {/* the first and last pages, and the ones round this one; "…" for the rest */}
              {pageLinks(page, pages).map((n, i) =>
                n === "gap" ? (
                  <span key={`gap-${i}`} className={s.pageGap} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={hrefFor(n)}
                    className={s.pageLink}
                    aria-current={n === page ? "page" : undefined}
                    aria-label={`Page ${n}`}
                  >
                    {n}
                  </Link>
                ),
              )}
              {page < pages && (
                <Link href={hrefFor(page + 1)} className={s.pageLink}>
                  Older →
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

export default function AnnouncementsPage({ searchParams }: Props) {
  return (
    <div className={`bg-white ${s.page}`}>
      <PageHeader title="Announcements" intro={INTRO} />
      <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
