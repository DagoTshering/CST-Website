import Image from "next/image";
import type { CSSProperties } from "react";

import { ScrollPin } from "@/components/motion/ScrollPin";
import { Carousel } from "@/components/ui/Carousel";
import scene from "@/components/ui/CarouselScene.module.css";
import { ClockIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { eventsSection, type CollegeEvent } from "@/content/home";
import { dateParts, formatDate } from "@/lib/dates";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** One event: the photograph, then the date beside the title. The whole card is the link. */
function EventCard({ event }: { event: CollegeEvent }) {
  const start = dateParts(event.startDate);
  const range = event.endDate
    ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
    : formatDate(event.startDate);

  return (
    <li className="group relative w-[min(80vw,23rem)] shrink-0 snap-start">
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-line-soft shadow-[0_24px_48px_-26px_rgb(22_35_43/0.35)] ${scene.photo}`}
      >
        <Image
          src={event.photo.src}
          alt={event.photo.alt}
          fill
          sizes="(min-width: 768px) 368px, 80vw"
          className="object-cover transition-[scale] duration-[1200ms] ease-out-soft group-hover:scale-[1.05]"
        />
      </div>
      <div
        className={`mt-5 grid grid-cols-[auto_1fr] gap-x-5 border-t border-line pt-4 ${scene.caption}`}
      >
        <time dateTime={event.startDate} className="leading-none">
          <span className="block font-serif text-[2.75rem] font-bold tracking-tight text-ink lining-nums transition-colors group-hover:text-primary-strong">
            {start.day}
          </span>
          <span className="mt-1 block font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            {start.month} {start.year}
          </span>
        </time>
        <div>
          {/* two lines kept for every title, so the cards are one height */}
          <h3 className="min-h-[2lh] font-serif text-[1.25rem] leading-snug font-semibold text-ink">
            <SmartLink
              href={event.href}
              className="transition-colors after:absolute after:inset-0 group-hover:text-primary-strong"
            >
              {event.title}
            </SmartLink>
          </h3>
          <p className="mt-2 flex items-center gap-2 font-mono text-xs tracking-[0.06em] text-muted">
            <ClockIcon className="size-4 text-brass" />
            {range}
          </p>
          {!event.titleComplete && (
            <p className="mt-1.5 text-xs text-muted">
              <span className="font-semibold">To verify:</span> full title and summary.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * The latest events as a carousel of cards on the graph paper Facilities uses, in the same
 * carousel scene: one screen on a desktop, held there while the page's scroll carries the
 * cards past when there are more than fit (see ui/CarouselScene.module.css). From the homepage
 * on main, set in the drafting style of the sections above.
 */
export function Events() {
  return (
    <ScrollPin
      id={eventsSection.id}
      aria-labelledby="events-title"
      className={`overflow-x-clip ${scene.scene}`}
    >
      <div className={`section-y graph-paper bg-paper-soft ${scene.frame}`}>
        <div
          className={`container-page grid gap-x-16 gap-y-6 lg:grid-cols-12 lg:items-end ${scene.head}`}
        >
          <div className="lg:col-span-6">
            <SectionHeading label={eventsSection.label} id="events-title">
              {eventsSection.heading}
            </SectionHeading>
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-5 lg:col-start-8 lg:items-end lg:text-right">
            <p
              data-reveal
              suppressHydrationWarning
              style={delay(160)}
              className="text-[1.03125rem] text-copy"
            >
              {eventsSection.text}
            </p>
            <SheetLink href={eventsSection.link.href}>{eventsSection.link.label}</SheetLink>
          </div>
        </div>

        <div
          data-reveal
          suppressHydrationWarning
          style={delay(240)}
          className={`mt-10 lg:mt-14 ${scene.rows}`}
        >
          <Carousel label="Latest events" count={eventsSection.items.length} pinned>
            {eventsSection.items.map((event) => (
              <EventCard key={event.title} event={event} />
            ))}
          </Carousel>
        </div>
      </div>
    </ScrollPin>
  );
}
