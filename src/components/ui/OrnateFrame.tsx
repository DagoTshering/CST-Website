import type { CSSProperties, ReactNode } from "react";

import { cx } from "@/lib/cx";

import s from "./OrnateFrame.module.css";

/**
 * Traditional Bhutanese corner border, traced from a reference artwork as straight-line
 * vector shapes (one corner; the other three are mirror images). Only the outline is used:
 * it takes its colour from `currentColor` (the surrounding text colour) unless `color` is passed.
 *
 * <OrnateFrame>…</OrnateFrame>       frames content with all four corners
 * <CornerOrnament corner="tr" />     a single corner, for custom layouts
 */
const CORNER =
  "M5 127 5 202 11 202 11 161 16 161 16 162 17 162 17 185 22 185 22 156 11 156 11 127ZM17 17 17 22 22 22 22 17ZM127 5 127 11 156 11 156 22 185 22 185 17 162 17 162 16 161 16 161 12 162 12 162 11 202 11 202 5ZM40 5 40 40 5 40 5 57 22 57 22 46 25 46 25 45 32 45 32 46 34 46 34 63 5 63 5 80 16 80 16 81 17 81 17 86 5 86 5 121 28 121 28 115 22 115 22 110 23 110 23 109 28 109 28 104 24 104 24 103 22 103 22 98 17 98 17 103 15 103 15 104 12 104 12 103 11 103 11 92 22 92 22 75 11 75 11 69 39 69 39 68 40 68 40 63 51 63 51 52 52 52 52 51 63 51 63 40 68 40 68 39 69 39 69 11 75 11 75 22 92 22 92 11 103 11 103 12 104 12 104 16 103 16 103 17 98 17 98 22 103 22 103 24 104 24 104 28 109 28 109 23 110 23 110 22 115 22 115 28 121 28 121 5 86 5 86 17 81 17 81 16 80 16 80 5 63 5 63 34 46 34 46 32 45 32 45 25 46 25 46 22 57 22 57 5ZM11 109 16 109 16 110 17 110 17 115 11 115ZM40 51 45 51 45 52 46 52 46 56 45 56 45 57 40 57ZM12 45 16 45 16 46 17 46 17 51 11 51 11 46 12 46ZM52 40 57 40 57 45 56 45 56 46 52 46 52 45 51 45 51 41 52 41ZM40 40 45 40 45 41 46 41 46 45 45 45 45 46 41 46 41 45 40 45ZM109 11 115 11 115 17 110 17 110 16 109 16ZM46 11 51 11 51 17 46 17 46 14 45 14 45 12 46 12ZM5 5 5 34 34 34 34 5ZM11 11 28 11 28 28 11 28Z";

export type Corner = "tl" | "tr" | "bl" | "br";

/** Full corner is 205 units; the compact one keeps only the dense knot pattern (124 units). */
const flip = (corner: Corner, v: number) =>
  ({
    tl: undefined,
    tr: `translate(${v} 0) scale(-1 1)`,
    bl: `translate(0 ${v}) scale(1 -1)`,
    br: `translate(${v} ${v}) scale(-1 -1)`,
  })[corner];

type Size = number | string;
const len = (size: Size) => (typeof size === "number" ? `${size}px` : size);

/** One corner, `var(--orn)` square: set by the frame, or by CornerOrnament's `size`. */
function CornerSvg({
  corner,
  compact,
  className,
  style,
}: {
  corner: Corner;
  compact: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const v = compact ? 124 : 205;
  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      aria-hidden="true"
      focusable="false"
      className={cx(s.corner, className)}
      style={style}
    >
      <path d={CORNER} fill="currentColor" fillRule="evenodd" transform={flip(corner, v)} />
    </svg>
  );
}

export function CornerOrnament({
  corner = "tl",
  size = 96,
  compact = false,
  className,
  style,
}: {
  corner?: Corner;
  size?: Size;
  /** keep only the dense pattern, for small sizes such as card borders */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <CornerSvg
      corner={corner}
      compact={compact}
      className={className}
      style={{ "--orn": len(size), ...style } as CSSProperties}
    />
  );
}

/**
 * Frames its content with the four corners.
 * size: corner size, a number of px or any CSS length (default 'clamp(56px, 9vw, 116px)').
 * compact: use the shorter corner with only the dense pattern; best below about 64px.
 * color: ornament colour; leave it out to inherit the text colour (so hover colours work).
 * Content is padded so it never sits under a corner.
 */
export function OrnateFrame({
  children,
  size = "clamp(56px, 9vw, 116px)",
  compact = false,
  color,
  className,
  style,
}: {
  children: ReactNode;
  size?: Size;
  compact?: boolean;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cx(s.frame, className)}
      style={{ ...(color ? { color } : {}), "--orn": len(size), ...style } as CSSProperties}
    >
      {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
        <CornerSvg key={c} corner={c} compact={compact} className={cx(s.placed, s[c])} />
      ))}
      <div className={s.content}>{children}</div>
    </div>
  );
}
