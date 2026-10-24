import Image from "next/image";
import type { CSSProperties } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartLink } from "@/components/ui/SmartLink";
import { about } from "@/content/home";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedAbout } from "@/lib/cms/resources/about";

import s from "./About.module.css";
import { AboutEmblem } from "./AboutEmblem";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** The heading with its emphasised word in colour, underlined by a gold stroke that draws in. */
function Heading({ text, emphasis }: { text: string; emphasis: string | null }) {
  const at = emphasis ? text.indexOf(emphasis) : -1;
  if (!emphasis || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <em className={s.emphasis}>
        {emphasis}
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
      {text.slice(at + emphasis.length)}
    </>
  );
}

/**
 * About CST: the heading overlaps the aerial photograph, and behind the photograph a technical
 * drawing of the emblem turns. On a desktop the section fills one screen below the header. The
 * text and photograph are edited in the admin panel (About CST); the section is left out while
 * it is unpublished.
 */
export async function About() {
  const result = await loadPublished("About CST", getPublishedAbout);
  if (!result.ok || !result.data) return null;
  const { heading, emphasis, subtitle, paragraphs, caption, photo } = result.data;

  return (
    <section id={about.id} aria-labelledby="about-title" className={s.section}>
      <div className={`container-page ${s.grid}`}>
        <header className={s.head}>
          <SectionHeading label={about.label} id="about-title" titleClassName={s.title}>
            <Heading text={heading} emphasis={emphasis} />
          </SectionHeading>
          {subtitle && (
            <p data-reveal="" suppressHydrationWarning style={delay(160)} className={s.subtitle}>
              {/* the separator keeps to the place name, so a wrapped line never ends with it */}
              {subtitle.replace(" · ", " · ")}
            </p>
          )}
        </header>

        <div className={s.copy}>
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
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
          {/* the emblem: right of the section on a desktop, behind the photo below */}
          <div className={s.panel} aria-hidden="true">
            <div data-reveal="" suppressHydrationWarning className={s.emblem}>
              <AboutEmblem halo="#ffffff" />
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
            <span className={s.fig}>Fig. 01</span>
            {caption && <> — {caption}</>}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
