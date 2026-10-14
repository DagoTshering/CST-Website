import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/cx";

type SectionHeadingProps = {
  /** Small label above the heading. */
  label?: string;
  children: ReactNode;
  id?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
};

/**
 * A section's label and h2. The label carries the hero's two-tone drafting rule (ink, then
 * gold), which draws in as the heading comes into view.
 */
export function SectionHeading({
  label,
  children,
  id,
  align = "start",
  tone = "light",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cx(align === "center" && "text-center", className)}>
      {label && (
        <p
          data-reveal
          className={cx(
            "eyebrow flex items-center gap-3",
            align === "center" && "justify-center",
            tone === "light" ? "text-primary-strong" : "text-accent-soft",
          )}
        >
          <span
            aria-hidden="true"
            data-reveal="rule"
            className="block h-px w-10 shrink-0 bg-linear-to-r from-sheet-tick from-60% to-sheet-gold to-60%"
          />
          {label}
        </p>
      )}
      <h2
        id={id}
        data-reveal
        style={{ "--reveal-delay": "80ms" } as CSSProperties}
        className={cx(
          "mt-4 text-h2 font-semibold text-balance",
          tone === "light" ? "text-ink" : "text-white",
        )}
      >
        {children}
      </h2>
    </div>
  );
}
