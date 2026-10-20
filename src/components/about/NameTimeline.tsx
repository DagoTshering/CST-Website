import { Emphasised } from "@/components/ui/Emphasis";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { Timeline } from "@/components/ui/timeline";
import type { AboutPageContent } from "@/lib/cms/resources/about-page";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

/** The college's names, oldest first, on the scroll-driven timeline. */
export function NameTimeline({ content }: { content: AboutPageContent["names"] }) {
  if (content.items.length === 0) return null;
  return (
    <section className="container-page section-top" aria-labelledby="names-title">
      <SectionHead
        id="names-title"
        eyebrow="Our name through the years"
        title={<Emphasised text={content.heading} word={content.emphasis ?? ""} />}
        className={s.timelineHead}
      >
        {content.text}
      </SectionHead>
      <Timeline
        className={s.timeline}
        aria-labelledby="names-title"
        data={content.items.map((n) => ({
          title: n.year,
          content: (
            <>
              <h3 className={s.name}>{n.name}</h3>
              {n.note && <span className={s.note}>{n.note}</span>}
              <PhotoFrame
                src={n.photo?.src}
                alt={n.photo?.alt}
                label={n.year}
                className={s.namePhoto}
              />
            </>
          ),
        }))}
      />
    </section>
  );
}
