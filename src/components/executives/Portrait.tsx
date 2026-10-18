"use client";

import Image from "next/image";
import { useState } from "react";

import { initials, type Executive } from "@/content/executives";

import s from "./Executives.module.css";

/**
 * An executive's photograph, cropped from the top so the face stays in view. Their initials sit
 * underneath: they show while the photo loads, and in its place if there is none or it fails.
 */
export function Portrait({ person, sizes }: { person: Executive; sizes: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : person.photo;

  return (
    <div className={s.photo}>
      <span className={s.initials} aria-hidden="true">
        {initials(person.name)}
      </span>
      {src && (
        <Image
          src={src}
          alt={person.alt}
          fill
          sizes={sizes}
          className={s.image}
          onError={() => setFailed(true)}
          // a photo that failed before hydration has no onError left to fire
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
        />
      )}
    </div>
  );
}
