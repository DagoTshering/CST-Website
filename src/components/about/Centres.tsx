import { Emphasised } from "@/components/ui/Emphasis";
import { InteractiveAccordion } from "@/components/ui/InteractiveAccordion";
import { PendingNotice } from "@/components/ui/PendingNotice";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { SmartLink } from "@/components/ui/SmartLink";
import type { AboutPageContent, CentreGroup } from "@/lib/cms/resources/about-page";

import s from "./About.module.css";
import { SectionHead } from "./SectionHead";

type Centre = AboutPageContent["centres"]["items"][number];

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

/** "a", "a and b", "a, b and c" */
const listOf = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** A centre's panel: its description (or a neutral line), links, what is still missing, a photo. */
function CentreBody({ centre, fallback }: { centre: Centre; fallback: string }) {
  const missing = [
    !centre.fullName && "full name",
    !centre.description && "description",
    !centre.websiteUrl && !centre.email && "contact",
  ].filter((item): item is string => Boolean(item));
  return (
    <div className={s.centre}>
      <div>
        <p>{centre.description ?? fallback}</p>
        {(centre.websiteUrl || centre.email) && (
          <p className={s.centreLinks}>
            {centre.websiteUrl && <SmartLink href={centre.websiteUrl}>Website</SmartLink>}
            {centre.email && <a href={`mailto:${centre.email}`}>{centre.email}</a>}
          </p>
        )}
        {missing.length > 0 && (
          <PendingNotice className={s.centrePending}>
            {listOf(missing).replace(/^./, (c) => c.toUpperCase())} to be added.
          </PendingNotice>
        )}
      </div>
      <PhotoFrame
        src={centre.photo?.src}
        alt={centre.photo?.alt}
        label={centre.acronym}
        className={s.centrePhoto}
      />
    </div>
  );
}

/**
 * The research and innovation centres, in two accordions numbered on from one to the other,
 * all closed to start with.
 */
export function Centres({ content }: { content: AboutPageContent["centres"] }) {
  const groups = GROUPS.map((g) => ({
    ...g,
    centres: content.items.filter((c) => c.group === g.group),
  })).filter((g) => g.centres.length > 0);
  if (groups.length === 0) return null;
  // each centre's anchor is its name (#crsed), with its id only if two share a name
  const anchor = (centre: Centre) =>
    content.items.filter((c) => slug(c.acronym) === slug(centre.acronym)).length > 1
      ? `${slug(centre.acronym)}-${centre.id}`
      : slug(centre.acronym);
  // the number each group's first centre carries
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.centres.length, 1));

  return (
    <section id="centres" className="container-page section-top" aria-labelledby="centres-title">
      <SectionHead
        id="centres-title"
        eyebrow="Research and innovation"
        title={<Emphasised text={content.heading} word={content.emphasis ?? ""} />}
      >
        {content.text}
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
              id: anchor(centre),
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
