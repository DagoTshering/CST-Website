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
          className={`${s.rule} pb-4 font-display text-[clamp(0.625rem,min(1.15vw,1.6svh),0.84375rem)] font-medium tracking-[0.22em] text-primary-strong uppercase [background-size:3.5rem_1px]`}
        >
          {hero.eyebrow}
        </p>

        <h1
          id="hero-title"
          className={`${s.title} mt-[clamp(0.75rem,2.2svh,1.75rem)] font-display`}
        >
          <span className="block font-light">{hero.title.lead}</span>
          <span className={`${s.rule} block pb-[0.08em] font-medium text-primary`}>
            {hero.title.emphasis}
          </span>
        </h1>

        <p className="mt-[clamp(1rem,2.4svh,1.75rem)] max-w-xl font-display text-[clamp(1rem,min(1.5vw,2.45svh),1.3125rem)] leading-[1.55] text-ink/80">
          {hero.tagline}
        </p>

        <div className="mt-[clamp(1.5rem,3.4svh,2.5rem)] flex w-full flex-col items-center justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row">
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

        <div className="mt-[clamp(2rem,4.4svh,3.25rem)] w-full">
          <MarkStrip programmes={hero.programmes} label={hero.stripLabel} />
        </div>
      </div>
    </HeroAnimator>
  );
}
