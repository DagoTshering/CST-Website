import { Emphasis } from "@/components/ui/Emphasis";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { about } from "@/lib/about";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

/**
 * The first section, close under the page's title band: the college in one paragraph, beside a
 * campus panorama.
 */
export function Intro() {
  return (
    <section
      id="our-story"
      className="container-page pt-[clamp(2rem,1.5rem+2vw,3.5rem)]"
      aria-labelledby="college-title"
    >
      <SectionHead
        id="college-title"
        eyebrow="The college"
        title={
          <>
            A college of the Royal University of <Emphasis>Bhutan</Emphasis>
          </>
        }
      />
      <div className={s.columns} data-reveal suppressHydrationWarning>
        <p className={s.statement}>{about.paragraphs[0]}</p>
        <PhotoFrame label="campus panorama" className={s.panorama} />
      </div>
    </section>
  );
}
