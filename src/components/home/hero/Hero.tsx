import Image from "next/image";
import type { CSSProperties } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { EndlessKnot } from "@/components/ui/EndlessKnot";
import { hero } from "@/content/home";

import s from "./hero.module.css";
import { HeroMotion } from "./HeroMotion";

/** Lines of the faint blueprint grid; each draws in once, a little after the one before. */
const GRID_COLUMNS = 11;
const GRID_ROWS = 9;

/** The step in the staggered entrance (and in the grid's draw-in). */
const step = (n: number) => ({ "--step": n }) as CSSProperties;

export function Hero() {
  const { image } = hero;

  return (
    <HeroMotion aria-labelledby="hero-title" className={s.hero}>
      <div className={s.media}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          className={s.photo}
          style={{ objectPosition: image.focus }}
        />
      </div>
      <div className={s.shade} aria-hidden="true" />

      <div className={s.body}>
        <div className={s.stage} aria-hidden="true">
          <div className={s.grid}>
            {Array.from({ length: GRID_COLUMNS }, (_, i) => (
              <i key={`c${i}`} className={s.column} style={{ ...step(i), left: `${i * 6}rem` }} />
            ))}
            {Array.from({ length: GRID_ROWS }, (_, i) => (
              <i key={`r${i}`} className={s.row} style={{ ...step(i + 2), top: `${i * 6}rem` }} />
            ))}
          </div>
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <EndlessKnot key={corner} className={s.knot} data-corner={corner} />
          ))}
        </div>

        <div className="container-page">
          <div className={s.copy}>
            <p className={`${s.eyebrow} ${s.rise}`} style={step(0)}>
              {hero.eyebrow}
            </p>
            <h1 id="hero-title" className={`${s.title} ${s.rise}`} style={step(1)}>
              {hero.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className={`${s.tagline} ${s.rise}`} style={step(2)}>
              {hero.tagline}
            </p>
            <div className={`${s.actions} ${s.rise}`} style={step(3)}>
              {hero.actions.map((action) => (
                <ButtonLink
                  key={action.href}
                  href={action.href}
                  tone="dark"
                  variant={action.variant === "primary" ? "primary" : "secondary"}
                >
                  {action.label}
                </ButtonLink>
              ))}
            </div>
          </div>
        </div>

        <div className={s.cue} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>

      <div className={`${s.facts} ${s.rise}`} style={step(4)}>
        <dl className="container-page grid grid-cols-2 md:grid-cols-4">
          {hero.facts.map((fact) => (
            <div key={fact.label} className={s.fact}>
              <dt className={s.factLabel}>{fact.label}</dt>
              <dd className={s.factValue}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </HeroMotion>
  );
}
