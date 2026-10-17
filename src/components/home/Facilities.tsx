import Image from "next/image";
import type { CSSProperties } from "react";

import { ScrollPin } from "@/components/motion/ScrollPin";
import { Carousel } from "@/components/ui/Carousel";
import { Emphasised } from "@/components/ui/Emphasis";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { facilities } from "@/content/home";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedFacilities } from "@/lib/cms/resources/facilities";

import scene from "@/components/ui/CarouselScene.module.css";

import s from "./Facilities.module.css";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/**
 * The campus facilities: the heading and quote above a carousel of photographs. On a desktop
 * the section fits one screen below the header, and with motion allowed it holds there
 * (ScrollPin) while the page's scroll carries the cards past, one after another, until the last
 * is in view; then it scrolls away. See ui/CarouselScene.module.css. The facilities are edited
 * in the admin panel; with none published, the section is left out.
 */
export async function Facilities() {
  const result = await loadPublished("facilities", getPublishedFacilities);
  if (!result.ok || result.data.length === 0) return null;
  const items = result.data;

  return (
    <ScrollPin
      id={facilities.id}
      aria-labelledby="facilities-title"
      className={`overflow-x-clip ${scene.scene}`}
    >
      {/* the pinned frame carries the paper, so the grid stays still behind the cards */}
      <div className={`section-y graph-paper bg-paper-soft ${scene.frame}`}>
        <div
          className={`container-page grid gap-x-16 gap-y-8 lg:grid-cols-12 lg:items-end ${scene.head}`}
        >
          <div className="lg:col-span-5">
            <SectionHeading label={facilities.label} id="facilities-title">
              <Emphasised text={facilities.heading} word={facilities.emphasis} />
            </SectionHeading>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p
              data-reveal
              suppressHydrationWarning
              style={delay(120)}
              className={`serif-italic text-[clamp(1.5rem,1.2rem+1.1vw,2.125rem)] leading-tight text-primary-deep ${s.quote}`}
            >
              &ldquo;{facilities.quote}&rdquo;
            </p>
            <p
              data-reveal
              suppressHydrationWarning
              style={delay(200)}
              className={`mt-3 max-w-xl text-copy ${s.intro}`}
            >
              {facilities.intro}
            </p>
          </div>
        </div>

        {/* the row reveals as one, so the next card always peeks in from the edge */}
        <div
          data-reveal
          suppressHydrationWarning
          style={delay(260)}
          className={`mt-12 lg:mt-16 ${scene.rows}`}
        >
          <Carousel label="Campus facilities" count={items.length} pinned>
            {items.map((item, i) => (
              <li key={item.id} className="group w-[min(80vw,23rem)] shrink-0 snap-start">
                <div
                  className={`relative aspect-[4/3] overflow-hidden bg-line-soft shadow-[0_24px_48px_-26px_rgb(22_35_43/0.35)] ${scene.photo}`}
                >
                  <Image
                    src={item.photo.src}
                    alt={item.photo.alt}
                    fill
                    sizes="(min-width: 768px) 368px, 80vw"
                    className="object-cover transition-[scale] duration-[1200ms] ease-out-soft group-hover:scale-[1.05]"
                  />
                </div>
                <div
                  className={`mt-5 flex items-baseline gap-4 border-t border-line pt-4 ${scene.caption}`}
                >
                  <span className="font-mono text-[0.75rem] tracking-[0.1em] text-brass-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-h4 font-semibold text-ink">{item.title}</h3>
                    <p className={`mt-2 text-small text-copy ${scene.text}`}>{item.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </Carousel>
        </div>
      </div>
    </ScrollPin>
  );
}
