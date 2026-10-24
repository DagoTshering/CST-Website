import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { ArrowRightIcon } from "./icons";
import { SmartLink } from "./SmartLink";

type Variant = "primary" | "secondary" | "text";
type Tone = "light" | "dark";

const base =
  "group inline-flex items-center justify-center gap-2 font-display font-semibold transition duration-200 ease-out-soft";

const solid = "min-h-12 rounded-sm px-6 py-3 text-[0.9375rem] tracking-[0.01em]";

/**
 * The 1px lift on hover, with a hover area that stays put. Without care, a resting pointer can
 * make the button flicker between its two states sixty times a second:
 * - at a button edge that falls on half a pixel, as the browser rounds an untransformed box to
 *   whole pixels but measures a transformed one exactly; a translate of 0 at rest keeps the
 *   button measured one way;
 * - at its bottom edge, which the lift moves away from the pointer; an invisible ::before moves
 *   back down as the button moves up, so the hover area stays where the button started.
 */
const lift =
  "relative translate-y-0 hover:-translate-y-px active:translate-y-0 before:absolute before:inset-0 hover:before:translate-y-px active:before:translate-y-0";

const styles: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: `${solid} ${lift} bg-primary-strong text-white shadow-sm hover:bg-primary-deep hover:shadow-md`,
    secondary: `${solid} ${lift} border border-primary-strong bg-white/80 text-primary-strong hover:bg-accent-soft`,
    text: "text-[0.9375rem] text-primary-strong hover:text-primary-deep",
  },
  dark: {
    primary: `${solid} ${lift} bg-white text-primary-deep shadow-sm hover:bg-accent-soft hover:shadow-md`,
    secondary: `${solid} ${lift} border border-white/70 text-white hover:bg-white/10`,
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

/**
 * A button in the same styles, for an action that is not a link, or one not yet available
 * (`disabled`: greyed out, no hover movement).
 */
export function Button({
  children,
  variant = "primary",
  tone = "light",
  disabled,
  className = "",
  ...props
}: Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  children: ReactNode;
  variant?: Exclude<Variant, "text">;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${styles[tone][variant]} disabled:pointer-events-none disabled:border-line disabled:bg-line-soft disabled:text-muted disabled:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

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
