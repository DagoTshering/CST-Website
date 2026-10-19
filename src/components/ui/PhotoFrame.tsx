import Image from "next/image";

import { cx } from "@/lib/cx";

import s from "./PhotoFrame.module.css";

/**
 * A framed photograph (white mount, hairline, brass corner mark). Without a `src`, a hatched
 * placeholder captioned "Photo · <label>", hidden from screen readers; give it a `src` and an
 * `alt` and the photograph (next/image, cropped to fill) takes its place. The frame takes its
 * size from `className`.
 */
export function PhotoFrame({
  src,
  alt = "",
  label,
  sizes = "(min-width: 900px) 50vw, 100vw",
  className,
}: {
  src?: string | null;
  alt?: string;
  /** What the photograph will show, for the placeholder's caption. */
  label: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={cx(s.frame, className)}>
      {src ? (
        <div className={s.box}>
          <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
        </div>
      ) : (
        <div className={s.placeholder} aria-hidden="true">
          Photo · {label}
        </div>
      )}
    </div>
  );
}
