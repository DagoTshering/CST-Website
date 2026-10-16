import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

import { SmartLink } from "./SmartLink";

/**
 * A text link in About's lettering: spaced capitals and a thin drawn arrow that moves on as
 * the link is hovered. For the "view all" links at the head of a list.
 */
export function SheetLink({
  href,
  children,
  tone = "light",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <SmartLink
      href={href}
      className={cx(
        "group inline-flex min-h-11 items-center gap-4 font-display text-[0.78125rem] font-medium tracking-[0.24em] uppercase transition-colors duration-300",
        tone === "dark"
          ? "text-white hover:text-accent [--focus-ring:var(--color-accent)]"
          : "text-ink hover:text-primary-strong",
        className,
      )}
    >
      {children}
      <svg
        viewBox="0 0 18 10"
        aria-hidden="true"
        focusable="false"
        className="h-2.5 w-[18px] flex-none text-brass transition-[translate] duration-300 group-hover:translate-x-[3px]"
      >
        <path
          d="M0 5H17M12.5 .8L17 5l-4.5 4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="square"
        />
      </svg>
    </SmartLink>
  );
}
