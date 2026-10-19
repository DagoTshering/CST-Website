import { Emphasis } from "@/components/ui/Emphasis";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Timeline } from "@/components/ui/timeline";
import { about } from "@/lib/about";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

/** The college's three names, on the scroll-driven timeline. */
export function NameTimeline() {
  return (
    <section className="container-page section-top" aria-labelledby="names-title">
      <SectionHead
        id="names-title"
        eyebrow="Our name through the years"
        title={
          <>
            Three names, <Emphasis>one college</Emphasis>
          </>
        }
        className={s.timelineHead}
      >
        From a polytechnic in 1974 to the College of Science and Technology we know today.
      </SectionHead>
      <Timeline
        className={s.timeline}
        aria-labelledby="names-title"
        data={about.names.map((n) => ({
          title: n.year,
          content: (
            <>
              <h3 className={s.name}>{n.name}</h3>
              <span className={s.note}>{n.note}</span>
              <PhotoFrame label={n.year} className={s.namePhoto} />
            </>
          ),
        }))}
      />
    </section>
  );
}
