"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import s from "./StudentHub.module.css";

export type ClubIndexItem = {
  /** The club's own page; followed from here, it opens as a pop-up over the list. */
  href: string;
  name: string;
  /** Up to two thumbnails for the hover preview. */
  thumbs: string[];
};

/**
 * Every club as a link to its page, in columns read top to bottom (three on a laptop, two on a
 * tablet, one on a phone). After the 21st.dev reveal-images list, at index scale: hovering or
 * focusing a row scales in two small photo cards, fanned apart, at its right end. The CSS does
 * the reveal; this component only holds back the thumbnails until someone points at or tabs
 * into the list, so a visit that never does fetches none of them. Touch screens never show them.
 */
export function ClubIndex({ items }: { items: ClubIndexItem[] }) {
  const [armed, setArmed] = useState(false);
  const columns = (n: number) => Math.ceil(items.length / n);

  return (
    <nav aria-label="Clubs">
      <ol
        className={s.index}
        style={{ "--rows-3": columns(3), "--rows-2": columns(2) } as CSSProperties}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") setArmed(true);
        }}
        onFocus={() => setArmed(true)}
      >
        {items.map((item) => (
          <li key={item.href}>
            {/* scroll={false}: the list stays where it is under the pop-up */}
            <Link href={item.href} scroll={false} className={s.row}>
              <span className={s.rowName}>{item.name}</span>
              {armed && item.thumbs.length > 0 && (
                <span className={s.preview} aria-hidden="true">
                  {item.thumbs.slice(0, 2).map((src, k) => (
                    <span key={src} className={s.card} data-card={k}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- a 360px WebP thumbnail */}
                      <img src={src} alt="" loading="lazy" decoding="async" />
                    </span>
                  ))}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
