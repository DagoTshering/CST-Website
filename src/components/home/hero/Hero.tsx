import type { CSSProperties } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { hero, programmes } from "@/content/home";

import s from "./hero.module.css";
import { HeroAnimator } from "./HeroAnimator";
import { HeroSheet } from "./HeroSheet";
import { MarkStrip } from "./MarkStrip";

const stops = programmes.map(({ key, title, year }) => ({ key, title, year }));

/** The copy's place in the entrance: it rises first, then the sheet fills in around it. */
const step = (n: number) => ({ "--step": n }) as CSSProperties;

export function Hero() {
  return (
    <HeroAnimator stops={stops} aria-labelledby="hero-title" className={s.hero}>
      <HeroSheet programmes={programmes} />

      <div
        data-hero-copy=""
        className={`${s.copy} container-page flex flex-col items-center text-center`}
      >
        <p
          className={`${s.rule} ${s.eyebrow} ${s.rise} font-display font-semibold text-primary-deep uppercase [background-size:3.5rem_1px]`}
          style={step(0)}
        >
          {hero.eyebrow}
        </p>

        <h1 id="hero-title" className={`${s.title} ${s.rise} font-display`} style={step(1)}>
          <span className="block font-light">{hero.title.lead}</span>
          <span className={`${s.rule} block pb-[0.08em] font-medium text-primary`}>
            {hero.title.emphasis}
          </span>
        </h1>

        <p className={`${s.tagline} ${s.rise} max-w-xl font-display text-ink/80`} style={step(2)}>
          {hero.tagline}
        </p>

        <div
          className={`${s.actions} ${s.rise} flex w-full flex-col items-center justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row`}
          style={step(3)}
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

        <div className={`${s.legend} w-full`}>
          <MarkStrip programmes={programmes} label={hero.stripLabel} />
        </div>
      </div>
    </HeroAnimator>
  );
}
