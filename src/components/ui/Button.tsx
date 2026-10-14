import type { ReactNode } from "react";

import { ArrowRightIcon } from "./icons";
import { SmartLink } from "./SmartLink";

type Variant = "primary" | "secondary" | "text";
type Tone = "light" | "dark";

const base =
  "group inline-flex items-center justify-center gap-2 font-display font-semibold transition duration-200 ease-out-soft";

const solid = "min-h-12 rounded-sm px-6 py-3 text-[0.9375rem] tracking-[0.01em]";

const styles: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: `${solid} bg-primary-strong text-white shadow-sm hover:-translate-y-px hover:bg-primary-deep hover:shadow-md active:translate-y-0`,
    secondary: `${solid} border border-primary-strong bg-white/80 text-primary-strong hover:-translate-y-px hover:bg-accent-soft active:translate-y-0`,
    text: "text-[0.9375rem] text-primary-strong hover:text-primary-deep",
  },
  dark: {
    primary: `${solid} bg-white text-primary-deep shadow-sm hover:-translate-y-px hover:bg-accent-soft hover:shadow-md active:translate-y-0`,
    secondary: `${solid} border border-white/70 text-white hover:-translate-y-px hover:bg-white/10 active:translate-y-0`,
    text: "text-[0.9375rem] text-white hover:text-accent",
  },
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  tone?: Tone;
  className?: string;
};

/** The site's one link-styled-as-button: primary, secondary (outline) or text with an arrow. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  tone = "light",
  className = "",
}: ButtonLinkProps) {
  return (
    <SmartLink
      href={href}
      className={`${base} ${styles[tone][variant]} ${tone === "dark" ? "[--focus-ring:var(--color-accent)]" : ""} ${className}`}
    >
      {children}
      {variant === "text" && (
        <ArrowRightIcon className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" />
      )}
    </SmartLink>
  );
}
