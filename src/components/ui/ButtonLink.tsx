import type { ReactNode } from "react";

import { Icon } from "./Icon";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline-light";
};

const variants = {
  primary: "bg-brand text-navy hover:bg-white",
  "outline-light": "border border-white/35 text-white hover:border-brand hover:text-brand",
};

/** Link styled as a button, for calls to action. */
export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={`group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-card px-6 text-sm font-semibold transition-colors duration-200 ${variants[variant]}`}
    >
      {children}
      <Icon name="arrow" className="transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}
