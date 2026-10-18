import type { Metadata } from "next";
import { Suspense } from "react";

import { LevelFilter } from "@/components/programmes/LevelFilter";
import { LevelFilterFromUrl } from "@/components/programmes/LevelFilterFromUrl";
import s from "@/components/programmes/Programmes.module.css";
import { CategoryList } from "@/components/ui/CategoryList";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedProgrammeList } from "@/lib/cms/resources/programme-pages";

export const metadata: Metadata = {
  title: "Programmes",
  description: `The bachelor's and master's programmes of the ${site.name}, ${site.university}: their structure, entry requirements, career paths and facilities.`,
};

type Item = Awaited<ReturnType<typeof getPublishedProgrammeList>>[number];

const meta = (p: Item) => [p.degree, p.duration, p.departmentName].filter(Boolean).join(" · ");

/** The programmes by level, each a link to its page. */
function Groups({ programmes }: { programmes: Item[] }) {
  const groups = [
    { level: "bachelor", title: "Undergraduate programmes" },
    { level: "master", title: "Postgraduate programmes" },
  ] as const;
  return groups.map((group) => {
    const items = programmes.filter((p) => p.level === group.level);
    if (items.length === 0) return null;
    return (
      <section
        key={group.level}
        className={s.group}
        data-group={group.level}
        aria-labelledby={`programmes-${group.level}`}
      >
        <p className={s.groupCount}>
          {items.length} {items.length === 1 ? "programme" : "programmes"}
        </p>
        <h2 id={`programmes-${group.level}`} className={s.groupTitle}>
          {group.title}
        </h2>
        <CategoryList
          items={items.map((p) => ({
            href: `/programmes/${p.slug}`,
            title: p.name,
            meta: meta(p),
            summary: p.summary,
          }))}
        />
      </section>
    );
  });
}

/** The listing: read from the database at request time (Admin › Academic Programmes). */
async function Programmes() {
  const result = await loadPublished("programmes", getPublishedProgrammeList);
  if (!result.ok) {
    return (
      <p className="py-16 text-copy">
        The programmes cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  if (result.data.length === 0) {
    return <p className="py-16 text-copy">No programmes are listed at the moment.</p>;
  }
  const groups = <Groups programmes={result.data} />;
  return (
    // the tabs follow ?level=; until the page is running they show every programme
    <Suspense fallback={<LevelFilter level="all">{groups}</LevelFilter>}>
      <LevelFilterFromUrl>{groups}</LevelFilterFromUrl>
    </Suspense>
  );
}

export default function ProgrammesPage() {
  return (
    <div className="bg-white">
      <PageHeader
        title="Programmes"
        intro="Programmes in engineering, architecture and information technology, each with its structure, entry requirements, career paths and facilities."
      />
      <div className={`container-page ${s.listPage}`}>
        <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
          <Programmes />
        </Suspense>
      </div>
    </div>
  );
}
