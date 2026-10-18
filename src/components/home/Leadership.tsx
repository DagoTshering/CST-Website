import type { CSSProperties } from "react";

import { Emphasised } from "@/components/ui/Emphasis";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheetLink } from "@/components/ui/SheetLink";
import { leadership } from "@/content/home";
import { loadPublished } from "@/lib/cms/public";
import { getFeaturedExecutive } from "@/lib/cms/resources/executives";

import s from "./Leadership.module.css";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/**
 * The college president, on the drawing sheet in blueprint: deep teal with a faint light grid
 * and a hairline sheet border, the portrait as a plate (Fig. 05). On a desktop it fits one
 * screen below the header (see Leadership.module.css). From the homepage on main, set in the
 * drafting style of the sections above. The person is the head of the executives' chart (Admin ›
 * Executives, level 1); without one published, with a photo, the section is left out.
 */
export async function Leadership() {
  const result = await loadPublished("leadership", getFeaturedExecutive);
  if (!result.ok || !result.data) return null;
  const leader = result.data;

  return (
    <section
      id={leadership.id}
      aria-labelledby="leadership-title"
      className={`section-y graph-paper relative overflow-hidden bg-primary-night text-white [--paper-grid:rgb(255_255_255/0.05)] ${s.section}`}
    >
      {/* the sheet border, as round the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[clamp(12px,1.75vw,28px)] border border-white/15"
      />
      <div className="container-page relative">
        <div className="grid items-center gap-14 md:grid-cols-12 lg:gap-20">
          <div
            className={`mx-auto w-full max-w-xs md:col-span-5 md:max-w-none lg:col-span-4 ${s.portrait}`}
          >
            <Plate
              photo={leader.photo}
              fig={5}
              caption={leadership.caption}
              aspect="4 / 5"
              tone="dark"
              sizes="(min-width: 768px) 22rem, 20rem"
            />
            <p data-reveal suppressHydrationWarning style={delay(200)} className="mt-5">
              <span className="block font-serif text-[1.625rem] leading-tight font-semibold">
                {leader.name}
              </span>
              <span className="mt-2 block font-mono text-[11px] tracking-[0.1em] text-on-dark-muted uppercase">
                {leader.designation}
              </span>
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-7 lg:col-start-6">
            <SectionHeading
              label={leadership.label}
              id="leadership-title"
              tone="dark"
              titleClassName={s.title}
            >
              <Emphasised text={leadership.heading} word={leadership.emphasis} tone="dark" />
            </SectionHeading>
            <blockquote
              data-reveal
              suppressHydrationWarning
              style={delay(160)}
              className={`mt-8 border-l border-brass pl-6 serif-italic text-[clamp(1.375rem,1.1rem+1vw,1.875rem)] leading-snug text-white/90 ${s.quote}`}
            >
              {leadership.statement}
            </blockquote>
            {leader.biography && (
              <p
                className={`mt-6 line-clamp-5 leading-relaxed whitespace-pre-line text-on-dark ${s.note}`}
              >
                {leader.biography}
              </p>
            )}
            <div className={`mt-8 flex flex-wrap gap-x-10 gap-y-2 ${s.links}`}>
              {leadership.links.map((link) => (
                <SheetLink key={link.label} href={link.href} tone="dark">
                  {link.label}
                </SheetLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
