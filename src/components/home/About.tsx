import Image from "next/image";
import type { CSSProperties } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { about } from "@/content/home";
import { site } from "@/content/site";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export function About() {
  const { photo } = about;

  return (
    <section id={about.id} aria-labelledby="about-title" className="section-y bg-surface">
      <div className="container-page grid items-center gap-x-16 gap-y-16 lg:grid-cols-12">
        <figure className="lg:col-span-6">
          <div className="crop-marks relative">
            <div
              data-reveal="photo"
              className="relative aspect-[5/4] overflow-hidden rounded-[2px] bg-line-soft"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 560px, (min-width: 768px) 90vw, 100vw"
                className="object-cover"
                style={{ objectPosition: photo.focus }}
              />
            </div>

            {/* the jubilee stamp, pinned to the photo's corner */}
            <div
              data-reveal
              style={delay(500)}
              className="absolute -bottom-8 left-5 flex items-center gap-3 rounded-sm bg-white py-3 pr-5 pl-3 shadow-md sm:left-8"
            >
              <span className="relative block size-12 shrink-0 overflow-hidden">
                <Image
                  src={site.logos.silverJubilee.src}
                  alt=""
                  width={site.logos.silverJubilee.width}
                  height={site.logos.silverJubilee.height}
                  sizes="81px"
                  className="absolute top-[-6.25%] left-[-36.4%] w-[167.8%] max-w-none"
                />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[0.9375rem] font-semibold text-ink">
                  {about.jubilee.title}
                </span>
                <span className="block text-small text-muted">{about.jubilee.detail}</span>
              </span>
            </div>
          </div>
          <figcaption className="mt-14 font-mono text-[0.75rem] tracking-[0.08em] text-muted uppercase">
            <span className="text-sheet-gold">Fig. 01</span> — {about.caption}
          </figcaption>
        </figure>

        <div className="lg:col-span-6 lg:col-start-7">
          <SectionHeading label={about.label} id="about-title">
            {about.heading}
          </SectionHeading>

          <div className="mt-6 space-y-5">
            {about.body.map((paragraph, i) => (
              <p
                key={paragraph.slice(0, 24)}
                data-reveal
                style={delay(140 + i * 80)}
                className={i === 0 ? "text-lead text-copy" : "text-copy"}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <ol className="mt-10 border-t border-line">
            {about.commitments.map((item, i) => (
              <li
                key={item.slice(0, 24)}
                data-reveal
                style={delay(260 + i * 90)}
                className="flex gap-5 border-b border-line py-5"
              >
                <span className="pt-1 font-mono text-[0.75rem] tracking-[0.1em] text-sheet-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-copy">{item}</p>
              </li>
            ))}
          </ol>

          <div data-reveal style={delay(420)} className="mt-8">
            <ButtonLink href={about.link.href} variant="text">
              {about.link.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
