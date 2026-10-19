import { Emphasis } from "@/components/ui/Emphasis";
import { InteractiveAccordion } from "@/components/ui/InteractiveAccordion";
import { PendingNotice } from "@/components/ui/PendingNotice";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { about, type Centre, type CentreGroup } from "@/lib/about";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

const GROUPS: { group: CentreGroup; title: string; label: string; fallback: string }[] = [
  {
    group: "research",
    title: "Research centres",
    label: "Research",
    fallback:
      "Part of the college's research work in disaster risk reduction, community development, renewable energy and sustainable technologies.",
  },
  {
    group: "innovation",
    title: "Innovation and entrepreneurship",
    label: "Innovation",
    fallback: "Part of the college's work to promote innovation and entrepreneurship.",
  },
];

const slug = (acronym: string) => acronym.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** A centre's panel: its description (or a neutral line), what is still missing, a photo. */
function CentreBody({ centre, fallback }: { centre: Centre; fallback: string }) {
  return (
    <div className={s.centre}>
      <div>
        <p>{centre.text ?? fallback}</p>
        <PendingNotice className={s.centrePending}>
          {centre.fullName ? "Description" : "Full name, description"}, activities and contact to be
          added.
        </PendingNotice>
      </div>
      <PhotoFrame label={centre.acronym} className={s.centrePhoto} />
    </div>
  );
}

/**
 * The research and innovation centres, in two accordions numbered on from one to the other,
 * all closed to start with. Nothing about a centre is filled in beyond about.json.
 */
export function Centres() {
  const groups = GROUPS.map((g) => ({
    ...g,
    centres: about.centres.filter((c) => c.group === g.group),
  })).filter((g) => g.centres.length > 0);
  // the number each group's first centre carries
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.centres.length, 1));

  return (
    <section id="centres" className="container-page section-top" aria-labelledby="centres-title">
      <SectionHead
        id="centres-title"
        eyebrow="Research and innovation"
        title={
          <>
            Where ideas get <Emphasis>built</Emphasis> and tested
          </>
        }
      >
        {about.paragraphs[3]}
      </SectionHead>

      {groups.map(({ group, title, label, fallback, centres }, i) => (
        <div key={group} className={s.group} data-reveal suppressHydrationWarning>
          <h3 className={s.groupTitle}>{title}</h3>
          <InteractiveAccordion
            defaultOpen={null}
            start={starts[i]}
            wide
            headingLevel={4}
            items={centres.map((centre) => ({
              id: slug(centre.acronym),
              title: centre.acronym,
              subtitle: centre.fullName ?? undefined,
              label,
              content: <CentreBody centre={centre} fallback={fallback} />,
            }))}
          />
        </div>
      ))}
    </section>
  );
}
