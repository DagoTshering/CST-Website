import Image from "next/image";

import { events, eventsIntro, type CollegeEvent } from "@/content/home";
import { dateParts, formatDate } from "@/lib/dates";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

function EventRow({ event }: { event: CollegeEvent }) {
  const start = dateParts(event.startDate);
  const range = event.endDate
    ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
    : formatDate(event.startDate);

  return (
    <li>
      <article className="group relative grid grid-cols-[4.5rem_1fr] gap-x-5 gap-y-5 border-b border-border py-8 sm:grid-cols-[5.5rem_13rem_1fr] sm:gap-x-8 lg:grid-cols-[7rem_16rem_1fr_auto] lg:items-center">
        <time dateTime={event.startDate} className="row-span-2 leading-none sm:row-span-1">
          <span className="block font-display text-5xl font-bold tracking-tight text-navy group-hover:text-brand-strong lg:text-6xl">
            {start.day}
          </span>
          <span className="mt-2 block text-xs font-semibold tracking-[0.16em] text-muted uppercase">
            {start.month} {start.year}
          </span>
        </time>

        <div className="relative aspect-[6/5] overflow-hidden rounded-card sm:row-span-1">
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="(min-width: 1024px) 16rem, (min-width: 640px) 13rem, 80vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="col-start-2 sm:col-start-auto">
          <h3 className="text-xl leading-snug font-bold text-navy sm:text-2xl">
            <a href={event.href} className="after:absolute after:inset-0">
              {event.title}
            </a>
          </h3>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Icon name="clock" className="text-brand-strong" />
            {range}
          </p>
          {event.summary && <p className="mt-3 leading-relaxed text-muted">{event.summary}</p>}
          {!event.titleComplete && (
            <p className="mt-3 text-xs text-muted">
              <span className="font-semibold">To verify:</span> full title and summary.
            </p>
          )}
        </div>

        <span
          aria-hidden="true"
          className="hidden size-12 place-items-center rounded-full border border-border text-lg text-navy transition-colors group-hover:border-brand group-hover:bg-brand lg:grid"
        >
          <Icon name="arrow" />
        </span>
      </article>
    </li>
  );
}

/** Date-led event listing. */
export function EventsSection() {
  return (
    <section
      id="events"
      aria-labelledby="events-title"
      className="bg-surface py-20 sm:py-24 lg:py-32"
    >
      <Container>
        <div className="flex flex-col gap-6 border-b-2 border-navy pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionHeading eyebrow="Campus life" title={eventsIntro.heading} id="events-title" />
            <p className="mt-4 text-lg text-muted">{eventsIntro.text}</p>
          </div>
          <ArrowLink href={eventsIntro.link.href} className="shrink-0">
            {eventsIntro.link.label}
          </ArrowLink>
        </div>
        <ul>
          {events.map((event) => (
            <EventRow key={event.title} event={event} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
