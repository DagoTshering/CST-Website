import Image from "next/image";

import { announcements, announcementsIntro, opportunities } from "@/content/home";
import { formatDate } from "@/lib/dates";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Compact notice board plus a small opportunities panel. */
export function AnnouncementsSection() {
  return (
    <section
      id="announcements"
      aria-labelledby="announcements-title"
      className="py-20 sm:py-24 lg:py-32"
    >
      <Container>
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Notices"
                title={announcementsIntro.heading}
                id="announcements-title"
              />
              <ArrowLink href={announcementsIntro.link.href} className="shrink-0">
                {announcementsIntro.link.label}
              </ArrowLink>
            </div>

            <ul className="mt-10 border-t-2 border-navy">
              {announcements.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className="group grid gap-x-8 gap-y-2 border-b border-border py-6 transition-colors hover:bg-surface sm:grid-cols-[8.5rem_1fr_auto] sm:items-start sm:px-3"
                  >
                    <span className="text-sm text-muted sm:pt-0.5">
                      {item.date ? (
                        <time dateTime={item.date}>{formatDate(item.date)}</time>
                      ) : (
                        <span title="Publication date to be verified">Date to verify</span>
                      )}
                    </span>
                    <span>
                      <span className="text-xs font-semibold tracking-[0.14em] text-brand-strong uppercase">
                        {item.category}
                        {item.documentType && (
                          <span className="ml-2 text-muted">· {item.documentType}</span>
                        )}
                      </span>
                      <span className="mt-1.5 block font-display text-lg leading-snug font-semibold text-navy group-hover:text-brand-strong">
                        {item.title}
                      </span>
                    </span>
                    <Icon
                      name={item.documentType ? "document" : "arrowUpRight"}
                      className="hidden text-xl text-muted transition-colors group-hover:text-brand-strong sm:block"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <aside aria-label="Opportunities" className="lg:col-span-4">
            <div className="overflow-hidden rounded-card bg-surface">
              <Image
                src={opportunities.image.src}
                alt={opportunities.image.alt}
                width={opportunities.image.width}
                height={opportunities.image.height}
                sizes="(min-width: 1024px) 24rem, 100vw"
                className="aspect-[16/10] w-full object-cover"
              />
              <ul className="divide-y divide-border px-7">
                {opportunities.items.map((item) => (
                  <li key={item.title}>
                    <a href={item.href} className="group block py-6">
                      <span className="flex items-center justify-between gap-4 font-display text-lg font-bold text-navy group-hover:text-brand-strong">
                        {item.title}
                        <Icon
                          name="arrow"
                          className="text-brand transition-transform group-hover:translate-x-1"
                        />
                      </span>
                      <span className="mt-1 block text-sm text-muted">{item.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
