import Image from "next/image";
import type { CSSProperties } from "react";

import type { Photo } from "@/content/home";
import { cx } from "@/lib/cx";

import s from "./Plate.module.css";

type PlateProps = {
  photo: Photo;
  /** Figure number; the page counts on from About's Fig. 01. */
  fig: number;
  caption: string;
  sizes: string;
  /**
   * The photograph's shape, e.g. "4 / 5" (the default is 4 / 3). null leaves the height to the
   * layout: the plate becomes a column whose photograph fills what the caption leaves of it.
   */
  aspect?: string | null;
  tone?: "light" | "dark";
  className?: string;
};

/**
 * A photograph set as a plate of the drawing, as About and Vision & Mission set theirs: crop
 * marks 12px outside it (the last in brass), a soft shadow, and a mono figure caption. It
 * reveals with the site's photo reveal; on a dark section the cover is the section's colour.
 */
export function Plate({
  photo,
  fig,
  caption,
  sizes,
  aspect = "4 / 3",
  tone = "light",
  className,
}: PlateProps) {
  return (
    <figure
      className={cx(s.plate, className)}
      data-tone={tone}
      data-fluid={aspect === null ? "" : undefined}
    >
      <div className={s.frame}>
        <i className={`${s.tick} ${s.tl}`} aria-hidden="true" />
        <i className={`${s.tick} ${s.tr}`} aria-hidden="true" />
        <i className={`${s.tick} ${s.bl}`} aria-hidden="true" />
        <i className={`${s.tick} ${s.br}`} aria-hidden="true" />
        <div
          data-reveal="photo"
          suppressHydrationWarning
          className={s.photo}
          style={aspect === null ? undefined : ({ aspectRatio: aspect } as CSSProperties)}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            className="object-cover"
            style={{ objectPosition: photo.focus }}
          />
        </div>
      </div>
      <figcaption className={s.caption}>
        <span className={s.fig}>Fig. {String(fig).padStart(2, "0")}</span> — {caption}
      </figcaption>
    </figure>
  );
}
