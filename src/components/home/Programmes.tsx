import { GraduationCap, Microscope } from "lucide-react";
import type { CSSProperties } from "react";

import { Emphasised } from "@/components/ui/Emphasis";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { SmartLink } from "@/components/ui/SmartLink";
import { programmesSection } from "@/content/home";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedProgrammes } from "@/lib/cms/resources/programmes";

import s from "./Programmes.module.css";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

type Level = (typeof programmesSection.levels)[number];

/**
 * A level as a card linking to it on the Programmes page: a blueprint ground, a large line icon
 * and a drawn arc. On hover or focus it lifts, the grid drifts, the arc draws itself,
 * the rule runs out and the arrow turns to point onward (CSS only; still with reduced motion).
 */
/** A degree for undergraduates; research and advanced study for postgraduates. */
const ICONS = { bachelor: GraduationCap, master: Microscope };

function LevelCard({
  level,
  number,
  count,
}: {
  level: Level;
  number: number;
  count: number | null;
}) {
  const Icon = ICONS[level.postgraduate ? "master" : "bachelor"];
  return (
    <SmartLink
      href={level.href}
      className={s.card}
      data-tone={level.postgraduate ? "master" : "bachelor"}
    >
      <Icon className={s.icon} strokeWidth={0.6} aria-hidden="true" focusable="false" />
      <svg className={s.arc} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r="52" pathLength="100" />
        <path d="M60 8v10M60 102v10M8 60h10M102 60h10" />
      </svg>

      <span className={s.cardTop}>
        <span className={s.eyebrow}>{level.eyebrow}</span>
        {count !== null && (
          <span className={s.count}>
            {count} {count === 1 ? "programme" : "programmes"}
          </span>
        )}
      </span>

      <span className={s.cardTitle}>{level.title}</span>
      <span className={s.rule} aria-hidden="true" />
      <span className={s.cardText}>{level.text}</span>

      <span className={s.cta}>
        {level.cta}
        <span className={s.arrow} aria-hidden="true">
          <svg viewBox="0 0 18 10" focusable="false">
            <path d="M0 5h16M12 1l4 4-4 4" />
          </svg>
        </span>
      </span>
    </SmartLink>
  );
}

/**
 * The two levels of study as cards, beside an introduction with the convocation photograph as
 * a plate (Fig. 04), with the college's key figures below them. Each card opens its level on the
 * Programmes page, where the programmes themselves are listed; the number on it counts the
 * published programmes of that level in the admin panel. On a desktop the introduction fits one
 * screen and holds still while the cards and figures scroll past (see Programmes.module.css). The
 * section always renders, as the hero links to it (without the counts if the database is down).
 */
export async function Programmes() {
  const result = await loadPublished("programmes", getPublishedProgrammes);
  const countOf = (postgraduate: boolean) =>
    result.ok
      ? // as on the Programmes page: those with a page of their own
        result.data.filter(
          (programme) => programme.slug && (programme.level === "postgraduate") === postgraduate,
        ).length
      : null;

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
            <div className="grid gap-5 sm:grid-cols-2">
              {programmesSection.levels.map((level, index) => (
                <div
                  key={level.href}
                  data-reveal
                  suppressHydrationWarning
                  style={delay(index * 140)}
                  className="flex"
                >
                  <LevelCard level={level} number={index + 1} count={countOf(level.postgraduate)} />
                </div>
              ))}
            </div>

            {/* the key figures close the section, so the introduction stays in view to the end */}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
