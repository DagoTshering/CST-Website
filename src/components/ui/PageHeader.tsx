import type { ReactNode } from "react";

/**
 * The title band of an inner page, on the homepage's graph paper fading into white above and
 * below (the page under it is white): the page's h1 in the sections' Cormorant italic over the
 * two-tone drafting rule (ink, then gold), and an optional line of introduction. Kept short, so
 * the page's content starts close under it. `paper={false}` drops the graph paper and the white,
 * for a title set over something of the page's own (Contact's campus photo).
 */
export function PageHeader({
  title,
  eyebrow,
  intro,
  paper = true,
  children,
}: {
  title: string;
  /** A small mono label above the title. */
  eyebrow?: string;
  intro?: string;
  paper?: boolean;
  /** Anything else under the introduction, such as a count. */
  children?: ReactNode;
}) {
  return (
    <header className={paper ? "relative isolate bg-white" : "relative isolate"}>
      {/* the graph paper, fading into the white above and below it */}
      {paper && (
        <div
          aria-hidden="true"
          className="graph-paper absolute inset-0 -z-10 bg-paper-soft [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
        />
      )}
      <div className="container-page pt-[clamp(2rem,1.25rem+2vw,3.25rem)] pb-[clamp(1.25rem,1rem+1vw,2rem)] text-center">
        {eyebrow && (
          <p className="mb-3 font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="heading-serif text-ink">{title}</h1>
        <span
          aria-hidden="true"
          className="mx-auto mt-5 block h-0.5 w-12 bg-linear-to-r from-sheet-tick from-60% to-sheet-gold to-60%"
        />
        {intro && <p className="mx-auto mt-4 max-w-3xl text-copy">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
