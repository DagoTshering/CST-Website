import type { CSSProperties } from "react";

import { ArrowRightIcon, DocumentIcon, ExternalIcon } from "@/components/ui/icons";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { announcementsSection } from "@/content/home";
import { formatDate } from "@/lib/dates";

import s from "./Announcements.module.css";

const { opportunities } = announcementsSection;

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/**
 * A notice board beside the opportunities: a plate (Fig. 06) on a strip of graph paper that
 * runs off the right edge, as About's does, with the two links under it. On a desktop it fits
 * one screen below the header (see Announcements.module.css). From the homepage on main, set in
 * the drafting style of the sections above.
 */
export function Announcements() {
  return (
    <section
      id={announcementsSection.id}
      aria-labelledby="announcements-title"
      className={`section-y overflow-hidden bg-white ${s.section}`}
    >
      <div className="container-page">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading label={announcementsSection.label} id="announcements-title">
                {announcementsSection.heading}
              </SectionHeading>
              <SheetLink href={announcementsSection.link.href} className="shrink-0">
                {announcementsSection.link.label}
              </SheetLink>
            </div>

            <ul className={`mt-10 border-t border-ink ${s.list}`}>
              {announcementsSection.items.map((item, i) => (
                <li key={item.title} data-reveal suppressHydrationWarning style={delay(i * 100)}>
                  <SmartLink
                    href={item.href}
                    className={`group grid gap-x-8 gap-y-2 border-b border-line py-6 transition-colors hover:border-primary sm:grid-cols-[8.5rem_1fr_auto] sm:items-start ${s.row}`}
                  >
                    <span className="font-mono text-xs tracking-[0.06em] text-muted sm:pt-1.5">
                      {item.date ? (
                        <time dateTime={item.date}>{formatDate(item.date)}</time>
                      ) : (
                        <span title="Publication date to be verified">Date to verify</span>
                      )}
                    </span>
                    <span>
                      <span className="eyebrow text-primary-strong">
                        {item.category}
                        {item.documentType && (
                          <span className="ml-2 text-muted">· {item.documentType}</span>
                        )}
                      </span>
                      <span
                        className={`mt-1.5 block font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-colors group-hover:text-primary-strong ${s.title}`}
                      >
                        {item.title}
                      </span>
                    </span>
                    {item.documentType ? (
                      <DocumentIcon className="hidden size-5 text-muted transition-colors group-hover:text-primary-strong sm:block" />
                    ) : (
                      <ExternalIcon className="hidden size-5 text-muted transition-colors group-hover:text-primary-strong sm:block" />
                    )}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>

          <aside aria-label={opportunities.label} className="relative lg:col-span-4 lg:col-start-9">
            {/* the graph-paper strip, from a quarter of the way under the plate to the screen's edge */}
            <div
              aria-hidden="true"
              className="graph-paper pointer-events-none absolute -top-10 -right-[50vw] bottom-24 left-1/4 bg-paper [mask-image:linear-gradient(to_bottom,transparent,#000_12%,#000_88%,transparent)]"
            />
            <div className="relative">
              <Plate
                photo={opportunities.photo}
                fig={6}
                caption={opportunities.caption}
                aspect="16 / 10"
                sizes="(min-width: 1024px) 24rem, 100vw"
              />
              <ul className={`mt-6 border-t border-ink ${s.links}`}>
                {opportunities.items.map((item, i) => (
                  <li
                    key={item.title}
                    data-reveal
                    suppressHydrationWarning
                    style={delay(120 + i * 100)}
                    className="border-b border-line"
                  >
                    <SmartLink href={item.href} className={`group block py-5 ${s.link}`}>
                      <span className="flex items-center justify-between gap-4 font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-colors group-hover:text-primary-strong">
                        {item.title}
                        <ArrowRightIcon className="size-5 text-brass transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="mt-1 block text-small text-copy">{item.text}</span>
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
