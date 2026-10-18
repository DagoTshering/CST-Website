import type { CSSProperties } from "react";

import { DocumentIcon, ExternalIcon } from "@/components/ui/icons";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { announcementsSection } from "@/content/home";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedAnnouncements } from "@/lib/cms/resources/announcements";
import { formatDate } from "@/lib/dates";

import s from "./Announcements.module.css";

const { opportunities } = announcementsSection;

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/**
 * A notice board beside a campus photograph: a plate (Fig. 06) on a strip of graph paper that
 * runs off the right edge, as About's does. On a desktop it fits
 * one screen below the header (see Announcements.module.css). From the homepage on main, set in
 * the drafting style of the sections above. The notices are the latest published in the admin
 * panel; a notice with a PDF opens it.
 */
export async function Announcements() {
  const result = await loadPublished("announcements", getPublishedAnnouncements);
  const items = result.ok ? result.data : [];

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

            {items.length === 0 ? (
              <p className="mt-10 border-t border-ink pt-6 text-copy">
                There are no announcements at the moment.
              </p>
            ) : (
              <ul className={`mt-10 border-t border-ink ${s.list}`}>
                {items.map((item, i) => (
                  <li key={item.id} data-reveal suppressHydrationWarning style={delay(i * 100)}>
                    <SmartLink
                      href={item.documentUrl ?? announcementsSection.link.href}
                      className={`group grid gap-x-8 gap-y-2 border-b border-line py-6 transition-colors hover:border-primary sm:grid-cols-[8.5rem_1fr_auto] sm:items-start ${s.row}`}
                    >
                      <span className="font-mono text-xs tracking-[0.06em] text-muted sm:pt-1.5">
                        <time dateTime={item.publishedOn}>{formatDate(item.publishedOn)}</time>
                      </span>
                      <span>
                        {(item.category || item.documentUrl) && (
                          <span className="eyebrow text-primary-strong">
                            {item.category}
                            {item.documentUrl && (
                              <span className={item.category ? "ml-2 text-muted" : "text-muted"}>
                                {item.category ? "· " : ""}PDF
                              </span>
                            )}
                          </span>
                        )}
                        <span
                          className={`mt-1.5 block font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-colors group-hover:text-primary-strong ${s.title}`}
                        >
                          {item.title}
                        </span>
                      </span>
                      {item.documentUrl ? (
                        <DocumentIcon className="hidden size-5 text-muted transition-colors group-hover:text-primary-strong sm:block" />
                      ) : (
                        <ExternalIcon className="hidden size-5 text-muted transition-colors group-hover:text-primary-strong sm:block" />
                      )}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative lg:col-span-4 lg:col-start-9">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
