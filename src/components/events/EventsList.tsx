import Image from "next/image";
import type { CSSProperties } from "react";

import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { PendingNotice } from "@/components/ui/PendingNotice";
import { bhutanToday, dateRangeLabel } from "@/lib/admission";
import { loadPublished } from "@/lib/cms/public";
import { getAllPublishedEvents, type PublicEvent } from "@/lib/cms/resources/events";
import { dateParts } from "@/lib/dates";

import s from "./Events.module.css";
import { WhenFilter } from "./WhenFilter";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

const count = (n: number) => `${n} ${n === 1 ? "event" : "events"}`;

/** One event: the photograph, then the date beside the title, the details and the description. */
function EventRow({ event }: { event: PublicEvent }) {
  const start = dateParts(event.startDate);
  return (
    <li
      data-reveal
      suppressHydrationWarning
      style={delay(60)}
      className="grid gap-x-10 gap-y-5 border-b border-line py-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line-soft shadow-[0_24px_48px_-26px_rgb(22_35_43/0.35)]">
        <Image
          src={event.photo.src}
          alt={event.photo.alt}
          fill
          sizes="(min-width: 1088px) 400px, (min-width: 640px) 38vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="grid grid-cols-[auto_1fr] content-start gap-x-5">
        <time dateTime={event.startDate} className="leading-none">
          <span className="block font-serif text-[2.75rem] font-bold tracking-tight text-ink lining-nums">
            {start.day}
          </span>
          <span className="mt-1 block font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            {start.month} {start.year}
          </span>
        </time>
        <div className="min-w-0">
          <h3 className="font-serif text-[1.375rem] leading-snug font-semibold text-ink">
            {event.title}
          </h3>
          <p className="mt-2 flex items-center gap-2 font-mono text-xs tracking-[0.06em] text-muted">
            <ClockIcon className="size-4 shrink-0 text-brass" />
            {dateRangeLabel(event.startDate, event.endDate ?? event.startDate)}
          </p>
          {event.location && (
            <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <MapPinIcon className="size-4 shrink-0 text-brass" />
              {event.location}
            </p>
          )}
        </div>
        {event.description && (
          <p className="col-span-2 mt-5 max-w-[40em] leading-relaxed whitespace-pre-line text-copy">
            {event.description}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * The published events, upcoming (soonest first) then past (newest first, by year), with the
 * When tabs to show one or the other. An event is upcoming until its last day has passed in
 * Bhutan. Reads the database at request time through a cached query (Admin › Events).
 */
export async function EventsList() {
  const result = await loadPublished("events", getAllPublishedEvents);

  if (!result.ok) {
    return (
      <p className="container-page section-y text-center text-copy">
        The events cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  if (result.data.length === 0) {
    return (
      <p className="container-page section-y text-center text-copy">
        There are no events at the moment.
      </p>
    );
  }

  const today = bhutanToday();
  const upcoming = result.data
    .filter((event) => (event.endDate ?? event.startDate) >= today)
    .reverse();
  const past = result.data.filter((event) => (event.endDate ?? event.startDate) < today);

  const years: { year: string; events: PublicEvent[] }[] = [];
  for (const event of past) {
    const year = event.startDate.slice(0, 4);
    const last = years.at(-1);
    if (last?.year === year) last.events.push(event);
    else years.push({ year, events: [event] });
  }

  return (
    <div className={`container-page ${s.page}`}>
      <WhenFilter
        counts={{ all: result.data.length, upcoming: upcoming.length, past: past.length }}
      >
        <section className={s.group} data-group="upcoming" aria-labelledby="events-upcoming">
          <div className={s.groupHead}>
            <h2 id="events-upcoming" className={s.groupTitle}>
              Upcoming
            </h2>
            <p className={s.groupCount}>{count(upcoming.length)}</p>
          </div>
          {upcoming.length > 0 ? (
            <ul className={s.rows}>
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <PendingNotice className={s.empty}>
              No upcoming events have been announced yet.
            </PendingNotice>
          )}
        </section>

        <section className={s.group} data-group="past" aria-labelledby="events-past">
          <div className={s.groupHead}>
            <h2 id="events-past" className={s.groupTitle}>
              Past events
            </h2>
            <p className={s.groupCount}>{count(past.length)}</p>
          </div>
          {years.length > 0 ? (
            years.map(({ year, events }) => (
              <div key={year} aria-labelledby={`events-${year}`} role="group">
                <h3 id={`events-${year}`} className={s.year}>
                  {year}
                </h3>
                <ul className={s.rows}>
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <PendingNotice className={s.empty}>There are no past events yet.</PendingNotice>
          )}
        </section>
      </WhenFilter>
    </div>
  );
}

/** Shown while the events load. */
export function EventsListSkeleton() {
  return (
    <div aria-busy="true" className={`container-page ${s.page}`}>
      <span className="sr-only">Loading events…</span>
      <div className={s.filter}>
        <div className="mx-auto h-12 max-w-md animate-pulse bg-line-soft" />
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="grid gap-x-10 gap-y-5 border-b border-line py-8 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          >
            <div className="aspect-[4/3] animate-pulse bg-line-soft" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse bg-line-soft" />
              <div className="h-4 w-1/2 animate-pulse bg-line-soft" />
              <div className="h-20 animate-pulse bg-line-soft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
