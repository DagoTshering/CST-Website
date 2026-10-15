import Image from "next/image";
import type { CSSProperties } from "react";

import { Carousel } from "@/components/ui/Carousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { facilities } from "@/content/home";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export function Facilities() {
  return (
    <section
      id={facilities.id}
      aria-labelledby="facilities-title"
      className="section-y overflow-hidden bg-surface"
    >
      <div className="container-page grid gap-x-16 gap-y-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <SectionHeading label={facilities.label} id="facilities-title">
            {facilities.heading}
          </SectionHeading>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p
            data-reveal
            suppressHydrationWarning
            style={delay(120)}
            className="font-display text-h3 font-light text-primary-deep"
          >
            &ldquo;{facilities.quote}&rdquo;
          </p>
          <p
            data-reveal
            suppressHydrationWarning
            style={delay(200)}
            className="mt-3 max-w-xl text-copy"
          >
            {facilities.intro}
          </p>
        </div>
      </div>

      {/* the row reveals as one, so the next card always peeks in from the edge */}
      <div data-reveal suppressHydrationWarning style={delay(260)} className="mt-12 lg:mt-16">
        <Carousel label="Campus facilities" count={facilities.items.length}>
          {facilities.items.map((item, i) => (
            <li key={item.title} className="group w-[min(80vw,23rem)] shrink-0 snap-start">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-line-soft">
                <Image
                  src={item.photo.src}
                  alt={item.photo.alt}
                  fill
                  sizes="(min-width: 768px) 368px, 80vw"
                  className="object-cover transition-[scale] duration-[1200ms] ease-out-soft group-hover:scale-[1.05]"
                  style={{ objectPosition: item.photo.focus }}
                />
              </div>
              <div className="mt-5 flex items-baseline gap-4 border-t border-line pt-4">
                <span className="font-mono text-[0.75rem] tracking-[0.1em] text-sheet-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-h4 font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-small text-copy">{item.text}</p>
                </div>
              </div>
            </li>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
