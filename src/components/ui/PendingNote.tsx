import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/**
 * A visible marker on content that still needs confirming by the college (from the homepage on
 * main). Remove each one once its content has been confirmed.
 */
export function PendingNote({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cx(
        "inline-flex items-start gap-2 text-xs leading-relaxed",
        tone === "dark" ? "text-on-dark-muted" : "text-muted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mt-1 size-1.5 shrink-0 rounded-full border border-current"
      />
      <span>
        <span className="font-semibold">To verify:</span> {children}
      </span>
    </p>
  );
}
