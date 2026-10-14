import type { ReactNode } from "react";

import { Icon } from "./Icon";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
};

/** Text link with a trailing arrow that nudges on hover. */
export function ArrowLink({ href, children, tone = "light", className = "" }: ArrowLinkProps) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2 text-sm font-semibold ${
        tone === "dark" ? "text-white hover:text-brand" : "text-navy hover:text-brand-strong"
      } transition-colors ${className}`}
    >
      <span className="border-b border-current/30 pb-0.5 group-hover:border-current">
        {children}
      </span>
      <Icon
        name="arrow"
        className="text-brand transition-transform duration-200 group-hover:translate-x-1"
      />
    </a>
  );
}
