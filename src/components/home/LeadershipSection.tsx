import Image from "next/image";

import { leadership } from "@/content/home";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { PendingNote } from "@/components/ui/PendingNote";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Editorial feature on the college president. */
export function LeadershipSection() {
  return (
    <section
      id="leadership"
      aria-labelledby="leadership-title"
      className="relative overflow-hidden bg-navy py-20 text-white sm:py-24 lg:py-32"
    >
      <Container>
        <div className="grid items-center gap-14 md:grid-cols-12 lg:gap-20">
          <figure className="relative mx-auto w-full max-w-xs md:col-span-5 md:max-w-none lg:col-span-4">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -top-4 -left-4 h-full w-full rounded-card border border-brand/60"
              />
              <Image
                src={leadership.image.src}
                alt={leadership.image.alt}
                width={leadership.image.width}
                height={leadership.image.height}
                sizes="(min-width: 768px) 22rem, 20rem"
                className="relative aspect-[4/5] w-full rounded-card bg-white object-cover object-top"
              />
            </div>
            <figcaption className="mt-6">
              <span className="block font-display text-xl font-bold">{leadership.name}</span>
              <span className="mt-1 block text-sm text-on-navy-muted">
                {leadership.designation}
              </span>
            </figcaption>
          </figure>

          <div className="md:col-span-7 lg:col-span-7 lg:col-start-6">
            <SectionHeading
              eyebrow="Leadership and Governance"
              title={leadership.heading}
              id="leadership-title"
              tone="dark"
            />
            <blockquote className="mt-8 border-l-2 border-brand pl-6 font-display text-xl leading-relaxed text-white/90 sm:text-2xl">
              {leadership.statement}
            </blockquote>
            {leadership.bio ? (
              <p className="mt-6 leading-relaxed text-on-navy-muted">{leadership.bio}</p>
            ) : (
              <PendingNote tone="dark" className="mt-6">
                President&apos;s biography or message to be supplied by the college.
              </PendingNote>
            )}
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {leadership.links.map((link) => (
                <ArrowLink key={link.label} href={link.href} tone="dark">
                  {link.label}
                </ArrowLink>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
