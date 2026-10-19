import type { ReactNode } from "react";

import h from "@/components/ui/PageHero.module.css";

import s from "./About.module.css";

/**
 * A section's heading on About, in the hero's pattern: mono eyebrow, the h2 in Cormorant italic,
 * the short brass rule; then, optionally, a lead paragraph.
 */
export function SectionHead({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  /** The h2's id, which labels the section. */
  id: string;
  eyebrow: string;
  /** May hold an <Emphasis> word (teal, with the gold underline drawn in on reveal). */
  title: ReactNode;
  /** The lead paragraph. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-reveal suppressHydrationWarning>
      <p className={h.eyebrow}>{eyebrow}</p>
      <h2 id={id} className={s.title}>
        {title}
      </h2>
      <span className={h.rule} aria-hidden="true" />
      {children && <p className={s.lead}>{children}</p>}
    </div>
  );
}
