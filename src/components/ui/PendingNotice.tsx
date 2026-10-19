import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

/**
 * Said plainly where content is not there yet, in a dashed box, rather than filled with
 * plausible text (a programme's missing requirements, About's centres).
 */
export function PendingNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "max-w-[660px] border border-dashed border-line px-[18px] py-3.5 text-[0.9375rem] text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
