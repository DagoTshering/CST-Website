import { ButtonLink } from "@/components/ui/Button";
import { hero } from "@/content/home";

import s from "./hero.module.css";
import { HeroAnimator } from "./HeroAnimator";
import { HeroSheet } from "./HeroSheet";
import { MarkStrip } from "./MarkStrip";

const stops = hero.programmes.map(({ key, title, year }) => ({ key, title, year }));

export function Hero() {
  return (
    <HeroAnimator stops={stops} aria-labelledby="hero-title" className={s.hero}>
      <HeroSheet programmes={hero.programmes} />

      <div
        data-hero-copy=""
        className={`${s.copy} container-page flex flex-col items-center text-center`}
      >
        <p
          className={`${s.rule} ${s.eyebrow} font-display font-medium text-primary-strong uppercase [background-size:3.5rem_1px]`}
        >
          {hero.eyebrow}
        </p>

        <h1 id="hero-title" className={`${s.title} font-display`}>
          <span className="block font-light">{hero.title.lead}</span>
          <span className={`${s.rule} block pb-[0.08em] font-medium text-primary`}>
            {hero.title.emphasis}
          </span>
        </h1>

        <p className={`${s.tagline} max-w-xl font-display text-ink/80`}>{hero.tagline}</p>

        <div
          className={`${s.actions} flex w-full flex-col items-center justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row`}
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
          <MarkStrip programmes={hero.programmes} label={hero.stripLabel} />
        </div>
      </div>
    </HeroAnimator>
  );
}
