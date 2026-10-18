import { ChevronDownIcon, ExternalIcon } from "@/components/ui/icons";
import { safeUrl, type Project } from "@/lib/eu-projects";

import { ProjectDetails } from "./ProjectDetails";
import s from "./EuProjects.module.css";

function Text({ title, line }: { title: string; line?: string | null }) {
  return (
    <span className={s.text}>
      {/* a heading for screen readers' heading list; a span, as rows are links and summaries */}
      <span role="heading" aria-level={3} className={s.title}>
        {title}
      </span>
      {line && <span className={s.summary}>{line}</span>}
    </span>
  );
}

/**
 * One project in the list, as one of three kinds of row:
 * - details that open in place (like the Admissions questions: a native <details>, the chevron
 *   turning; `group` makes the projects of a group open one at a time),
 * - a link to the project's own website, with a "Website" box like the Downloads page's,
 * - or a plain row that says why there is nothing to open.
 */
export function ProjectRow({ project: p, group }: { project: Project; group: string }) {
  if (p.page === "accordion") {
    return (
      <details name={group} className={s.item}>
        <summary className={s.row}>
          <Text title={p.name} line={p.summary} />
          <span className={s.toggle}>
            <span className={s.toggleShow}>Details</span>
            <span className={s.toggleHide}>Close</span>
            <ChevronDownIcon className={s.chevron} aria-hidden="true" />
          </span>
        </summary>
        <div className={s.panel}>
          <ProjectDetails project={p} />
        </div>
      </details>
    );
  }

  const url = p.page === "external" ? safeUrl(p) : null;
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`${s.item} ${s.row}`}>
        <Text title={p.name} line={p.summary ?? p.externalLabel} />
        <span className={s.visit}>
          Website <ExternalIcon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <div className={`${s.item} ${s.row}`} data-plain="">
      <Text title={p.name} line={p.summary} />
      <span className={s.unavailable}>
        {p.slug === "eaccess" ? "Details to be added" : "Website no longer available"}
      </span>
    </div>
  );
}
