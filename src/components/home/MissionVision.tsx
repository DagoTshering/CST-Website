import Image from "next/image";
import type { CSSProperties } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { missionVision } from "@/content/home";

export function MissionVision() {
  return (
    <section
      aria-labelledby="mission-vision-title"
      className="section-y bg-white [--reveal-curtain:var(--color-white)]"
    >
      <div className="container-page">
        <SectionHeading label="Our purpose" id="mission-vision-title">
          {missionVision.heading}
        </SectionHeading>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-14 lg:gap-8">
          {missionVision.items.map((item, i) => (
            <article
              key={item.title}
              data-reveal="photo"
              suppressHydrationWarning
              style={{ "--reveal-delay": `${i * 160}ms` } as CSSProperties}
              className="group relative isolate flex min-h-[clamp(22rem,36vw,31rem)] flex-col justify-end overflow-hidden rounded-md bg-primary-night"
            >
              <Image
                src={item.photo.src}
                alt={item.photo.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="-z-10 object-cover transition-[scale] duration-[1400ms] ease-out-soft group-hover:scale-[1.04]"
                style={{ objectPosition: item.photo.focus }}
              />
              {/* deep teal from the bottom: at least 75% behind the text, so it reads on any photo */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-primary-night/95 via-primary-night/75 via-50% to-primary-night/10"
              />
              <div className="p-7 sm:p-9 lg:p-10">
                <h3 className="eyebrow flex items-center gap-3 text-white">
                  <span aria-hidden="true" className="block h-px w-8 bg-accent" />
                  {item.title}
                </h3>
                <p className="mt-4 max-w-[24ch] font-display text-[clamp(1.375rem,1.1rem+1vw,1.875rem)] leading-snug font-medium text-white">
                  {item.statement}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
