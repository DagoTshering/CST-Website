import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { CSSProperties } from "react";

import { Emphasised } from "@/components/ui/Emphasis";
import h from "@/components/ui/PageHero.module.css";
import { about } from "@/lib/about";

import s from "./About.module.css";

const ICONS = [GraduationCap, BookOpen, Users];

/** The vision as a quote, with the three things it is pursued through, coming in one by one. */
export function Vision() {
  return (
    <section className="container-page section-top" aria-labelledby="vision-title">
      <div className={s.vision}>
        <div data-reveal suppressHydrationWarning>
          <h2 id="vision-title" className={h.eyebrow}>
            Vision
          </h2>
          <blockquote className={s.quote}>
            <p>
              <Emphasised text={about.vision} word="Excellence" />
            </p>
          </blockquote>
          <p className={s.quoteText}>{about.paragraphs[1]}</p>
        </div>
        <ul className={s.pillars}>
          {about.pillars.map((pillar, i) => {
            const Icon = ICONS[i];
            return (
              <li
                key={pillar}
                className={s.pillar}
                data-reveal
                suppressHydrationWarning
                style={{ "--reveal-delay": `${200 + i * 200}ms` } as CSSProperties}
              >
                <span className={h.icon} aria-hidden="true">
                  <Icon strokeWidth={1.5} />
                </span>
                <span className={s.pillarText}>{pillar}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
