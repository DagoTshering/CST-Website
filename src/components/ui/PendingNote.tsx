import type { ReactNode } from "react";

/**
 * Visible marker for content that still needs verification by the college.
 * Remove the usages once the content has been confirmed.
 */
export function PendingNote({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={`inline-flex items-start gap-2 text-xs leading-relaxed ${
        tone === "dark" ? "text-on-navy-muted" : "text-muted"
      } ${className}`}
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
