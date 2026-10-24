import Image from "next/image";
import type { CSSProperties } from "react";

import { ScrollPin } from "@/components/motion/ScrollPin";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { missionVision } from "@/content/home";

import s from "./MissionVision.module.css";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** "Vision & Mission", with the ampersand in gold. */
function Heading() {
  const [before, after] = missionVision.heading.split(" & ");
  if (after === undefined) return missionVision.heading;
  return (
    <>
      {before} <span className={s.amp}>&amp;</span> {after}
    </>
  );
}

/** The statement with its key phrase in colour, underlined by a gold stroke that draws in. */
function Statement({ text, emphasis }: { text: string; emphasis: string }) {
  const at = text.indexOf(emphasis);
  if (at < 0) return text;
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
 * Vision and mission (in that order), set like two plates of a drawing: each statement beside
 * its photograph, the two alternating sides. Each photograph sits in crop marks on a strip of
 * graph paper that runs to the edge of the screen, with a figure caption in the hero's mono;
 * each statement carries a numbered callout, as a drawing labels its details. Figures continue
 * from About's Fig. 01.
 *
 * With motion allowed, ScrollPin holds the section on screen while the page scrolls through
 * it, and the stylesheet turns the vision plate into the mission plate with the scroll (--p):
 * the two plates lie on top of each other, a gold line sweeps across the photograph revealing
 * the mission's, the strip of graph paper slides across, and the statements trade places. A
 * scale beside the heading shows how far along it is. Without that, the plates simply stack.
 */
export function MissionVision() {
  return (
    <ScrollPin progress aria-labelledby="mission-vision-title" className={s.section}>
      <div className={s.pin}>
        <div className={`container-page ${s.inner}`}>
          <div className={s.head}>
            <SectionHeading label="Our purpose" id="mission-vision-title" titleClassName={s.title}>
              <Heading />
            </SectionHeading>
            <p className={s.scale} aria-hidden="true">
              <span>01</span>
              <i className={s.track}>
                <i className={s.fill} />
              </i>
              <span>02</span>
            </p>
          </div>

          <div className={s.items}>
            {/* the pinned plates' shared strip of graph paper (each plate has its own otherwise) */}
            <div className={s.sheet} aria-hidden="true" />
            {missionVision.items.map((item, i) => (
              <article key={item.title} className={s.item}>
                <div className={s.text}>
                  <h3 data-reveal="" suppressHydrationWarning className={s.index}>
                    <span className={s.bubble} aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={s.rule}
                      aria-hidden="true"
                      data-reveal="rule"
                      suppressHydrationWarning
                    />
                    {item.title}
                  </h3>
                  <p
                    data-reveal=""
                    suppressHydrationWarning
                    style={delay(100)}
                    className={s.statement}
                  >
                    <Statement text={item.statement} emphasis={item.emphasis} />
                  </p>
                </div>

                <figure className={s.figure}>
                  <div className={s.panel} aria-hidden="true" />
                  <div className={s.frame}>
                    <i className={`${s.tick} ${s.tickTl}`} aria-hidden="true" />
                    <i className={`${s.tick} ${s.tickTr}`} aria-hidden="true" />
                    <i className={`${s.tick} ${s.tickBl}`} aria-hidden="true" />
                    <i className={`${s.tick} ${s.tickBr}`} aria-hidden="true" />
                    <div
                      data-reveal="photo"
                      suppressHydrationWarning
                      style={delay(80)}
                      className={s.photo}
                    >
                      <Image
                        src={item.photo.src}
                        alt={item.photo.alt}
                        fill
                        sizes="(min-width: 901px) 560px, 92vw"
                        className="object-cover"
                        style={{ objectPosition: item.photo.focus }}
                      />
                    </div>
                    {/* the gold line that sweeps across as the mission's photograph comes in */}
                    <i className={s.scan} aria-hidden="true" />
                  </div>
                  <figcaption className={s.caption}>
                    <span className={s.fig}>Fig. {String(i + 2).padStart(2, "0")}</span> —{" "}
                    {item.caption}
                  </figcaption>
                </figure>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ScrollPin>
  );
}
