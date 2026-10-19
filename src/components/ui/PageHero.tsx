import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import h from "./PageHero.module.css";
import { PhotoFrame } from "./PhotoFrame";

/**
 * The hero of a programme's page: mono eyebrow, the h1 in
 * Cormorant italic, the brass rule, a lede, then buttons and facts; `aside` (a PhotoCollage)
 * sits on the right, under the text below 900px.
 */
export function PageHero({
  id,
  eyebrow,
  title,
  lede,
  actions,
  facts,
  aside,
  className,
}: {
  /** The h1's id, which labels the section. */
  id: string;
  eyebrow: ReactNode;
  title: string;
  lede: ReactNode;
  /** ButtonLinks. */
  actions?: ReactNode;
  /** HeroFacts. */
  facts?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx(h.hero, className)} aria-labelledby={id}>
      <div className={`container-page ${h.grid}`}>
        <div>
          <p className={h.eyebrow}>{eyebrow}</p>
          <h1 id={id} className={h.title}>
            {title}
          </h1>
          <span className={h.rule} aria-hidden="true" />
          <p className={h.lede}>{lede}</p>
          {actions && <div className={h.buttons}>{actions}</div>}
          {facts}
        </div>
        {aside}
      </div>
    </section>
  );
}

export type HeroFact = {
  icon: ReactNode;
  value: string;
  /** What the value is, said to screen readers first. */
  term: string;
  /** The line under the value; left out, or the same as the term, it is not read twice. */
  label?: string;
  /** A long value (a department's name) in a smaller size. */
  small?: boolean;
};

/** A row of facts, each a value and a label beside a round icon. */
export function HeroFacts({ facts }: { facts: HeroFact[] }) {
  return (
    <dl className={h.stats}>
      {facts.map((fact) => (
        <div key={fact.term} className={h.stat}>
          <span className={h.icon} aria-hidden="true">
            {fact.icon}
          </span>
          <div>
            <dt className="sr-only">{fact.term}</dt>
            <dd className={cx(h.statValue, fact.small && h.statValueSmall)}>{fact.value}</dd>
            <dd
              className={h.statLabel}
              aria-hidden={!fact.label || fact.label === fact.term ? true : undefined}
            >
              {fact.label ?? fact.term}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export type CollagePhoto = { src?: string | null; alt?: string; label: string };

/**
 * Up to three overlapping framed photographs, with a brass square behind. Frames still waiting
 * for their photograph show a placeholder; with no photographs at all, the collage is hidden
 * from screen readers.
 */
export function PhotoCollage({ photos }: { photos: CollagePhoto[] }) {
  const frames = photos.slice(0, 3);
  const none = frames.every((p) => !p.src);
  return (
    <div className={h.collage} data-frames={frames.length} aria-hidden={none || undefined}>
      {frames.map((photo, i) => (
        <PhotoFrame
          key={i}
          {...photo}
          sizes="(min-width: 900px) 310px, 230px"
          className={h[`f${i + 1}`]}
        />
      ))}
      <span className={h.square} aria-hidden="true" />
    </div>
  );
}
