import { useId } from "react";

/**
 * A thin geometric band inspired by the woven diamond motifs of Bhutanese textiles.
 * Purely decorative; used sparingly as a divider.
 */
export function WeaveBand({ className = "" }: { className?: string }) {
  // useId output can contain characters that are not safe inside url(#...).
  const id = `weave${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg aria-hidden="true" focusable="false" className={`h-2.5 w-full ${className}`}>
      <defs>
        <pattern id={id} width="20" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 5 5 0l5 5-5 5Z M10 5l5-5 5 5-5 5Z" fill="none" stroke="currentColor" />
          <path d="M5 3.5 6.5 5 5 6.5 3.5 5Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
