import { Emphasised } from "@/components/ui/Emphasis";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import type { AboutPageContent } from "@/lib/cms/resources/about-page";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

/**
 * The first section, close under the page's title band: the college in one paragraph, beside a
 * campus panorama (a placeholder frame until a photo is added).
 */
export function Intro({ content }: { content: AboutPageContent["intro"] }) {
  return (
    <section
      id="our-story"
      className="container-page pt-[clamp(2rem,1.5rem+2vw,3.5rem)]"
      aria-labelledby="college-title"
    >
      <SectionHead
        id="college-title"
        eyebrow="The college"
        title={<Emphasised text={content.heading} word={content.emphasis ?? ""} />}
      />
      <div className={s.columns} data-reveal suppressHydrationWarning>
        <p className={s.statement}>{content.text}</p>
        <PhotoFrame
          src={content.photo?.src}
          alt={content.photo?.alt}
          label="campus panorama"
          className={s.panorama}
        />
      </div>
    </section>
  );
}
