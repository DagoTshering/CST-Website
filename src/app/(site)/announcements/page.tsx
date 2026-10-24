import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BroadcastHero } from "@/components/announcements/BroadcastHero";
import s from "@/components/announcements/NoticeBoard.module.css";
import { NoticeCard } from "@/components/announcements/NoticeCard";
import { site } from "@/content/site";
import { bhutanToday } from "@/lib/admission";
import { loadPublished } from "@/lib/cms/public";
import { getAnnouncementsPage } from "@/lib/cms/resources/announcements";

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
        <BroadcastHero all={0} latest={[]} />
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
      <BroadcastHero all={all} latest={latest} />
      <section aria-label="Notices" className={`graph-paper bg-paper-soft ${s.board}`}>
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
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={hrefFor(n)}
                  className={s.pageLink}
                  aria-current={n === page ? "page" : undefined}
                  aria-label={`Page ${n}`}
                >
                  {n}
                </Link>
              ))}
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
      <Suspense
        fallback={
          <>
            <BroadcastHero all={0} latest={[]} />
            <div aria-busy="true" className="min-h-[60vh] graph-paper bg-paper-soft" />
          </>
        }
      >
        <Board searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
