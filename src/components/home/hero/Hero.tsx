import { Fragment, type CSSProperties } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { hero } from "@/content/home";

import { stations } from "./clock";
import { DRAWINGS } from "./drawings";
import { GearTrain } from "./GearTrain";
import s from "./hero.module.css";
import { HeroFrame } from "./HeroFrame";
import { HeroSheet } from "./HeroSheet";
import { MARKS } from "./marks";
import { MiniDial } from "./MiniDial";
import { Stations } from "./Stations";
import { TourCaption } from "./TourCaption";

/** Each programme's drawing, in tour order. Mechanical's drawing is the gear train. */
const drawings = stations.map(({ key }) => {
  if (key === "mech") return <GearTrain key={key} className={s.drawing} />;
  const drawing = DRAWINGS[key];
  return (
    <svg key={key} className={s.drawing} viewBox={drawing.viewBox} aria-hidden="true">
      {drawing.content}
    </svg>
  );
});

const marks = stations.map(({ key }) => <Fragment key={key}>{MARKS[key]}</Fragment>);

/** The copy rises in order, one beat apart. */
const rise = (n: number) => ({ "--n": n }) as CSSProperties;

/**
 * The homepage hero: the programme clock. The programmes sit round one large oval like the
 * numbers on a clock face, and a gold hand steps from one to the next in the order they were
 * first offered. Below 1000px a small dial above the copy takes its place.
 */
export function Hero() {
  return (
    <HeroFrame aria-labelledby="hero-title" className={s.hero}>
      <HeroSheet />

      <div className={`${s.copy} flex flex-col items-center text-center`}>
        <MiniDial marks={marks} />

        <p
          className={`${s.rise} ${s.eyebrow} font-display font-medium text-primary-deep uppercase`}
          style={rise(0)}
        >
          {hero.eyebrow.split(" · ").map((part, i) => (
            <Fragment key={part}>
              {i > 0 && (
                <span className={s.eyebrowDot} aria-hidden="true">
                  {" · "}
                </span>
              )}
              <span className={s.eyebrowPart}>{part}</span>
            </Fragment>
          ))}
        </p>

        <h1 id="hero-title" className={`${s.rise} ${s.title}`} style={rise(1)}>
          <span className={s.titleLead}>{hero.title.lead}</span>
          <span className={s.titleEmphasis}>{hero.title.emphasis}</span>
        </h1>

        <p className={`${s.rise} ${s.tagline} font-display text-ink/80`} style={rise(2)}>
          {hero.tagline}
        </p>

        <div
          className={`${s.rise} ${s.actions} flex w-full flex-col items-center justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row`}
          style={rise(3)}
        >
          {hero.actions.map((action) => (
            <ButtonLink
              key={action.href}
              href={action.href}
              variant={action.variant === "primary" ? "primary" : "secondary"}
              className="w-full max-w-72 min-[420px]:w-auto"
            >
              {action.label}
            </ButtonLink>
          ))}
        </div>

        <TourCaption />
      </div>

      <Stations drawings={drawings} label={hero.clockLabel} />
    </HeroFrame>
  );
}
