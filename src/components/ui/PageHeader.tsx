import type { ReactNode } from "react";

import { SmartLink } from "./SmartLink";

type Crumb = {
  label: string;
  /** Left out for the current page, and for a menu group that has no page of its own. */
  href?: string;
};

type PageHeaderProps = {
  title: string;
  /** The trail from the homepage; the last crumb is the current page. */
  breadcrumbs: Crumb[];
  /** One line under the title. */
  intro?: ReactNode;
};

/**
 * The title band of an inner page, on the homepage's graph paper: a breadcrumb in the drawing
 * captions' mono capitals, the page's h1 in the sections' Cormorant italic, the two-tone drafting
 * rule (ink, then gold) and a line of introduction.
 */
export function PageHeader({ title, breadcrumbs, intro }: PageHeaderProps) {
  return (
    <header className="graph-paper border-b border-line bg-paper-soft">
      <div className="container-page py-[clamp(2.75rem,2rem+2.2vw,4.5rem)] text-center">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            {breadcrumbs.map((crumb, i) => {
              const current = i === breadcrumbs.length - 1;
              return (
                <li key={crumb.label} className="flex items-center gap-3">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-brass-deep">
                      /
                    </span>
                  )}
                  {crumb.href && !current ? (
                    <SmartLink
                      href={crumb.href}
                      className="underline decoration-line underline-offset-4 transition-colors hover:text-primary-strong hover:decoration-primary-strong"
                    >
                      {crumb.label}
                    </SmartLink>
                  ) : (
                    <span aria-current={current ? "page" : undefined}>{crumb.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="mt-5 heading-serif text-ink">{title}</h1>
        <span
          aria-hidden="true"
          className="mx-auto mt-5 block h-0.5 w-12 bg-linear-to-r from-sheet-tick from-60% to-sheet-gold to-60%"
        />
        {intro && <p className="mx-auto mt-4 max-w-3xl text-copy">{intro}</p>}
      </div>
    </header>
  );
}
