import type { Metadata } from "next";
import { Suspense } from "react";

import { LevelFilter } from "@/components/programmes/LevelFilter";
import { LevelFilterFromUrl } from "@/components/programmes/LevelFilterFromUrl";
import s from "@/components/programmes/Programmes.module.css";
import { CategoryList } from "@/components/ui/CategoryList";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import {
  bachelorProgrammes,
  getAllProgrammes,
  masterProgrammes,
  type Programme,
} from "@/content/programmes";

const count = getAllProgrammes().length;

export const metadata: Metadata = {
  title: "Programmes",
  description: `The ${count} bachelor's and master's programmes of the ${site.name}, ${site.university}: their structure, entry requirements, career paths and facilities.`,
};

const GROUPS: { level: "bachelor" | "master"; title: string; items: Programme[] }[] = [
  { level: "bachelor", title: "Undergraduate programmes", items: bachelorProgrammes() },
  { level: "master", title: "Postgraduate programmes", items: masterProgrammes() },
];

const meta = (p: Programme) => [p.degree, p.duration, p.departmentName].filter(Boolean).join(" · ");

/** The programmes by level, each a link to its page. */
function Groups() {
  return GROUPS.map((group) => (
    <section
      key={group.level}
      className={s.group}
      data-group={group.level}
      aria-labelledby={`programmes-${group.level}`}
    >
      <p className={s.groupCount}>{group.items.length} programmes</p>
      <h2 id={`programmes-${group.level}`} className={s.groupTitle}>
        {group.title}
      </h2>
      <CategoryList
        items={group.items.map((p) => ({
          href: `/programmes/${p.slug}`,
          title: p.name,
          meta: meta(p),
          summary: p.summary,
        }))}
      />
    </section>
  ));
}

export default function ProgrammesPage() {
  return (
    <div className="bg-white">
      <PageHeader
        title="Programmes"
        intro={`${count} programmes in engineering, architecture and information technology, each with its structure, entry requirements, career paths and facilities.`}
      />
      <div className={`container-page ${s.listPage}`}>
        {/* the tabs follow ?level=; until the page is running they show every programme */}
        <Suspense
          fallback={
            <LevelFilter level="all">
              <Groups />
            </LevelFilter>
          }
        >
          <LevelFilterFromUrl>
            <Groups />
          </LevelFilterFromUrl>
        </Suspense>
      </div>
    </div>
  );
}
