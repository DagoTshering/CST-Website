import { BookOpen, GraduationCap, Users } from "lucide-react";
import type { CSSProperties } from "react";

import { Emphasised } from "@/components/ui/Emphasis";
import h from "@/components/ui/PageHero.module.css";
import type { AboutPageContent } from "@/lib/cms/resources/about-page";

import s from "./About.module.css";

const ICONS = [GraduationCap, BookOpen, Users];

/** The vision as a quote, with what it is pursued through (up to three), coming in one by one. */
export function Vision({ content }: { content: AboutPageContent["vision"] }) {
  return (
    <section className="container-page section-top" aria-labelledby="vision-title">
      <div className={s.vision}>
        <div data-reveal suppressHydrationWarning>
          <h2 id="vision-title" className={h.eyebrow}>
            Vision
          </h2>
          <blockquote className={s.quote}>
            <p>
              <Emphasised text={content.statement} word={content.emphasis ?? ""} />
            </p>
          </blockquote>
          {content.text && <p className={s.quoteText}>{content.text}</p>}
        </div>
        {content.pillars.length > 0 && (
          <ul className={s.pillars}>
            {content.pillars.map((pillar, i) => {
              const Icon = ICONS[i % ICONS.length];
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
        )}
      </div>
    </section>
  );
}
