import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/cx";

import s from "./ClosingBlock.module.css";

/**
 * The block that ends a page (a programme's "Learn more", About's "Explore further"): a mono
 * eyebrow, a serif line and a sentence on the left, the buttons on the right, in a hairline box
 * with brass corner marks.
 */
export function ClosingBlock({
  id,
  eyebrow,
  title,
  text,
  children,
  className,
  style,
  reveal = false,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text: ReactNode;
  /** The ButtonLinks. */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Ease in on scroll (data-reveal). */
  reveal?: boolean;
}) {
  return (
    <div
      id={id}
      className={cx(s.block, className)}
      style={style}
      data-reveal={reveal || undefined}
      suppressHydrationWarning={reveal || undefined}
    >
      <div>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h2 className={s.title}>{title}</h2>
        <p className={s.text}>{text}</p>
      </div>
      <div className={s.actions}>{children}</div>
    </div>
  );
}
