import type { CSSProperties } from "react";

import { Emphasised } from "@/components/ui/Emphasis";
import { ExternalIcon } from "@/components/ui/icons";
import { PendingNote } from "@/components/ui/PendingNote";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { hero, programmesSection, type Programme } from "@/content/home";

import s from "./Programmes.module.css";

const { programmes } = hero;

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** "Bachelor of Engineering in Civil Engineering" -> "Civil Engineering"; the group says the rest. */
const shortName = (title: string) => title.replace(/^(Bachelor|Master) of (Engineering in )?/, "");

function ProgrammeRow({ programme, number }: { programme: Programme; number: number }) {
  return (
    <li>
      <SmartLink
        href={programmesSection.link.href}
        className="group grid grid-cols-[2.25rem_1fr_auto_auto] items-center gap-3 border-b border-line py-4 transition-colors hover:border-primary sm:py-5"
      >
        <span className="font-mono text-xs text-muted group-hover:text-primary-strong">
          {String(number).padStart(2, "0")}
        </span>
        <span className="font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-[translate,color] duration-200 group-hover:translate-x-1 group-hover:text-primary-strong sm:text-[1.5rem]">
          {shortName(programme.title)}
          <span className="sr-only">, {programme.title}</span>
        </span>
        {/* the year it was first offered (or will be), as on the hero's clock */}
        <span className="font-mono text-xs tracking-[0.12em] text-muted">{programme.year}</span>
        <ExternalIcon className="size-5 text-muted transition-colors group-hover:text-primary-strong" />
      </SmartLink>
    </li>
  );
}

/**
 * The programmes as an index, beside an introduction with the convocation photograph as
 * a plate (Fig. 04), with the college's key figures closing the list. On a desktop the
 * introduction fits one screen and holds still while the list and figures scroll past, to the end
 * of the section (see Programmes.module.css). The list is the hero's, so the
 * two always agree. From the homepage on main, set in the drafting style of the sections above.
 */
export function Programmes() {
  return (
    <section
      id={programmesSection.id}
      aria-labelledby="programmes-title"
      className="section-y bg-white"
    >
      <div className="container-page">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className={s.intro}>
              <SectionHeading
                label={programmesSection.label}
                id="programmes-title"
                titleClassName={s.title}
              >
                <Emphasised text={programmesSection.heading} word={programmesSection.emphasis} />
              </SectionHeading>
              <p
                data-reveal
                suppressHydrationWarning
                style={delay(160)}
                className={`mt-6 max-w-[34em] text-[1.03125rem] leading-[1.65] text-copy ${s.text}`}
              >
                {programmesSection.text}
              </p>
              <Plate
                photo={programmesSection.photo}
                fig={4}
                caption={programmesSection.caption}
                aspect={null}
                sizes="(min-width: 1024px) 30rem, 100vw"
                className={`mt-12 ${s.plate}`}
              />
              <SheetLink href={programmesSection.link.href} className={`mt-6 ${s.link}`}>
                {programmesSection.link.label}
              </SheetLink>
            </div>
          </div>

          <div className="grid gap-14 lg:col-span-7">
            {programmesSection.groups.map((group, g) => (
              <div key={group.title} data-reveal suppressHydrationWarning style={delay(g * 120)}>
                <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
                  <h3 className="eyebrow text-ink">{group.title}</h3>
                  <p className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                    {group.note}
                  </p>
                </div>
                <ul>
                  {programmes
                    .filter((programme) => Boolean(programme.postgraduate) === group.postgraduate)
                    .map((programme) => (
                      <ProgrammeRow
                        key={programme.key}
                        programme={programme}
                        number={programmes.indexOf(programme) + 1}
                      />
                    ))}
                </ul>
              </div>
            ))}

            {/* the key figures close the list, so the introduction stays in view to the end */}
            <div className="border-t border-line pt-10">
              <dl className="grid grid-cols-2 gap-y-10">
                {programmesSection.figures.map((figure, index) => (
                  <div
                    key={figure.label}
                    data-reveal
                    suppressHydrationWarning
                    style={delay(index * 90)}
                    className={`flex flex-col-reverse gap-2 ${index % 2 === 1 ? "border-l border-line pl-6 sm:pl-10" : ""}`}
                  >
                    <dt className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                      {figure.label}
                    </dt>
                    <dd className="font-serif text-[clamp(2.75rem,2rem+2.4vw,4rem)] leading-none font-bold tracking-tight text-ink lining-nums">
                      {figure.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <PendingNote className="mt-8">
                Figures are carried over from the previous website and should be confirmed as
                current.
              </PendingNote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
