import Image from "next/image";
import type { CSSProperties } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartLink } from "@/components/ui/SmartLink";
import { about } from "@/content/home";

import s from "./About.module.css";
import { AboutEmblem } from "./AboutEmblem";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** The heading with its emphasised word in colour, underlined by a gold stroke that draws in. */
function Heading() {
  const at = about.heading.indexOf(about.emphasis);
  if (at < 0) return about.heading;
  return (
    <>
      {about.heading.slice(0, at)}
      <em className={s.emphasis}>
        {about.emphasis}
        <svg
          className={s.swash}
          viewBox="0 0 240 14"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3 9C40 3 80 12 120 7S200 3 237 8" />
        </svg>
      </em>
      {about.heading.slice(at + about.emphasis.length)}
    </>
  );
}

/**
 * About CST: the heading overlaps the aerial photograph, and behind the photograph a strip of
 * graph paper carries a technical drawing of the emblem. On a desktop the section fills one
 * screen below the header.
 */
export function About() {
  const { photo } = about;

  return (
    <section id={about.id} aria-labelledby="about-title" className={s.section}>
      <div className={`container-page ${s.grid}`}>
        <header className={s.head}>
          <SectionHeading label={about.label} id="about-title" titleClassName={s.title}>
            <Heading />
          </SectionHeading>
          <p data-reveal="" suppressHydrationWarning style={delay(160)} className={s.subtitle}>
            {/* the separator keeps to the place name, so a wrapped line never ends with it */}
            {about.subtitle.replace(" · ", " · ")}
          </p>
        </header>

        <div className={s.copy}>
          {about.body.map((paragraph, i) => (
            <p
              key={paragraph.slice(0, 24)}
              data-reveal=""
              suppressHydrationWarning
              style={delay(220 + i * 60)}
              className={i === 0 ? s.lead : s.body}
            >
              {paragraph}
            </p>
          ))}

          <SmartLink
            href={about.link.href}
            data-reveal=""
            suppressHydrationWarning
            style={delay(340)}
            className={s.button}
          >
            {about.link.label}
            <svg viewBox="0 0 18 10" aria-hidden="true" focusable="false">
              <path d="M0 5H17M12.5 .8L17 5l-4.5 4.2" />
            </svg>
          </SmartLink>
        </div>

        <figure className={s.figure}>
          {/* the graph-paper strip: right of the section on a desktop, behind the photo below */}
          <div className={s.panel} aria-hidden="true">
            <div data-reveal="" suppressHydrationWarning className={s.emblem}>
              <AboutEmblem />
            </div>
          </div>

          <div className={s.frame}>
            <i className={`${s.tick} ${s.tickTl}`} aria-hidden="true" />
            <i className={`${s.tick} ${s.tickTr}`} aria-hidden="true" />
            <i className={`${s.tick} ${s.tickBl}`} aria-hidden="true" />
            <i className={`${s.tick} ${s.tickBr}`} aria-hidden="true" />
            <div data-reveal="photo" suppressHydrationWarning className={s.photo}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 901px) 510px, 360px"
                className="object-cover"
                style={{ objectPosition: photo.focus }}
              />
              <span className={s.wash} aria-hidden="true" />
            </div>
          </div>

          <figcaption className={s.caption}>
            <span className={s.fig}>Fig. 01</span> — {about.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
