import Image from "next/image";

import { keyFigures, programmes, programmesIntro, type Programme } from "@/content/home";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PendingNote } from "@/components/ui/PendingNote";
import { SectionHeading } from "@/components/ui/SectionHeading";

const groups: { level: Programme["level"]; title: string; note: string }[] = [
  { level: "Undergraduate", title: "Undergraduate", note: "Bachelor's degrees" },
  { level: "Postgraduate", title: "Postgraduate", note: "Master's degrees" },
];

function ProgrammeRow({ programme, number }: { programme: Programme; number: number }) {
  return (
    <li>
      <a
        href={programme.href}
        className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-border py-4 transition-colors hover:border-brand sm:py-5"
      >
        <span className="font-mono text-xs text-muted group-hover:text-brand-strong">
          {String(number).padStart(2, "0")}
        </span>
        <span className="font-display text-lg font-semibold text-navy transition-transform duration-200 group-hover:translate-x-1 sm:text-xl">
          {programme.name}
          {programme.verify && <span className="sr-only"> (programme title to be verified)</span>}
        </span>
        <Icon
          name="arrowUpRight"
          className="text-lg text-muted transition-colors group-hover:text-brand-strong"
        />
      </a>
    </li>
  );
}

/** Index-style programme showcase with a sticky introduction. */
export function AcademicProgramsSection() {
  return (
    <section id="programmes" aria-labelledby="programmes-title" className="py-20 sm:py-24 lg:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <SectionHeading
                eyebrow="Academic"
                title={programmesIntro.heading}
                id="programmes-title"
              />
              <p className="mt-6 leading-relaxed text-muted">{programmesIntro.text}</p>
              <Image
                src={programmesIntro.image.src}
                alt={programmesIntro.image.alt}
                width={programmesIntro.image.width}
                height={programmesIntro.image.height}
                sizes="(min-width: 1024px) 30rem, 100vw"
                className="mt-10 hidden aspect-[5/4] w-full rounded-card object-cover lg:block"
              />
              <ArrowLink href={programmesIntro.link.href} className="mt-8">
                {programmesIntro.link.label}
              </ArrowLink>
            </div>
          </div>

          <div className="grid gap-14 lg:col-span-7">
            {groups.map((group) => (
              <div key={group.level}>
                <div className="flex items-baseline justify-between gap-4 border-b-2 border-navy pb-3">
                  <h3 className="text-sm font-bold tracking-[0.16em] text-navy uppercase">
                    {group.title}
                  </h3>
                  <p className="text-sm text-muted">{group.note}</p>
                </div>
                <ul>
                  {programmes
                    .filter((programme) => programme.level === group.level)
                    .map((programme) => (
                      <ProgrammeRow
                        key={programme.name}
                        programme={programme}
                        number={programmes.indexOf(programme) + 1}
                      />
                    ))}
                </ul>
              </div>
            ))}
            <PendingNote>
              Undergraduate titles are taken from fields named on the previous website and must be
              confirmed against CST&apos;s official programme list.
            </PendingNote>
          </div>
        </div>

        <div className="mt-20 border-t border-border pt-10 lg:mt-24">
          <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
            {keyFigures.map((figure, index) => (
              <div
                key={figure.label}
                className={`flex flex-col-reverse gap-1 ${index % 2 === 1 ? "pl-6 sm:pl-10" : ""} lg:border-l lg:border-border lg:pl-10 ${index === 0 ? "lg:border-l-0 lg:pl-0" : ""}`}
              >
                <dt className="text-sm text-muted">{figure.label}</dt>
                <dd className="font-display text-4xl font-bold tracking-tight text-navy sm:text-5xl">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
          <PendingNote className="mt-8">
            Figures are carried over from the previous website and should be confirmed as current.
          </PendingNote>
        </div>
      </Container>
    </section>
  );
}
