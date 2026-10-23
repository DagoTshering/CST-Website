import Link from "next/link";
import type { CSSProperties } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";
import { dateParts } from "@/lib/dates";

import s from "./NoticeBoard.module.css";

export type NoticeSummary = {
  title: string;
  slug: string;
  summary: string | null;
  publishedOn: string;
  hasAttachment: boolean;
};

/** A notice's date as a rubber stamp: the day large, the month and year under it. */
export function DateStamp({ date }: { date: string }) {
  const { day, month, year } = dateParts(date);
  return (
    <time dateTime={date} className={s.stamp}>
      <span className={s.stampDay}>{day}</span>
      <span>
        {month} {year}
      </span>
    </time>
  );
}

/**
 * A notice pinned to the board: its date stamp, title and opening, linking to its
 * page. `featured` is the newest, shown large (with a NEW stamp while it is a week old or less).
 */
export function NoticeCard({
  notice,
  featured = false,
  isNew = false,
  delay = 0,
}: {
  notice: NoticeSummary;
  featured?: boolean;
  isNew?: boolean;
  delay?: number;
}) {
  const Heading = featured ? "h2" : "h3";
  return (
    <article
      className={`${s.note} ${featured ? s.featured : ""}`}
      data-reveal
      suppressHydrationWarning
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      <div className={s.paper}>
        {isNew && (
          <span className={s.newStamp} aria-label="New notice">
            NEW
          </span>
        )}
        <DateStamp date={notice.publishedOn} />
        <Heading className={s.noteTitle}>
          <Link href={`/announcements/${notice.slug}`}>{notice.title}</Link>
        </Heading>
        {notice.summary && <p className={s.summary}>{notice.summary}</p>}
        <p className={s.noteFoot}>
          <span className="inline-flex items-center gap-2">
            Read notice <ArrowRightIcon className="size-4" />
          </span>
          {notice.hasAttachment && (
            <span className={s.pdf}>
              <span className="sr-only">With a </span>PDF
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
