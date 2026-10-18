import type { Metadata } from "next";

import s from "@/components/eu-projects/EuProjects.module.css";
import { ProjectRow } from "@/components/eu-projects/ProjectRow";
import { StatusFilter } from "@/components/eu-projects/StatusFilter";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { projects, projectsWith, STATUSES } from "@/lib/eu-projects";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: `EU Projects | ${site.name}` },
    description: `The ${projects.length} European Union funded projects and partnerships of the ${site.name}, including Erasmus+ and Erasmus Mundus.`,
  };
}

/**
 * EU Projects (replacing cst.edu.bt/eu-project-links-2): every project in one list, active then
 * completed, filtered in place by the tabs. All from data/eu-projects.json (src/lib/eu-projects.ts).
 */
export default function EuProjectsPage() {
  const counts = {
    all: projects.length,
    active: projectsWith("active").length,
    completed: projectsWith("completed").length,
  };

  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Research and collaboration"
        title="EU Projects"
        intro={`${projects.length} European Union funded projects and partnerships the college takes part in, including Erasmus+ and Erasmus Mundus. Open a project to read its details, or follow the link to its own website.`}
      />
      <div className={`container-page ${s.page}`}>
        <StatusFilter counts={counts}>
          {STATUSES.map(({ status, title }) => {
            const items = projectsWith(status);
            return (
              <section
                key={status}
                className={s.group}
                data-group={status}
                aria-labelledby={`projects-${status}`}
              >
                <div className={s.groupHead}>
                  <h2 id={`projects-${status}`} className={s.groupTitle}>
                    {title}
                  </h2>
                  <p className={s.groupCount}>
                    {items.length} {items.length === 1 ? "project" : "projects"}
                  </p>
                </div>
                <ul className={s.rows}>
                  {items.map((p) => (
                    <li key={p.slug}>
                      <ProjectRow project={p} group={`projects-${status}`} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <p className={s.footNote}>
            Some older project websites are no longer online and are shown without a link.
          </p>
        </StatusFilter>
      </div>
    </div>
  );
}
