"use client";

import Image from "next/image";
import { useState } from "react";

import { initials, type StaffMember } from "@/content/staff";
import { cx } from "@/lib/cx";

import s from "./StaffDetails.module.css";

type StaffPhotoProps = {
  person: StaffMember;
  sizes: string;
  /** Empty for a copy of a portrait that is already described nearby (the carousel's side cards). */
  alt?: string;
  className?: string;
};

/**
 * A portrait, anchored to the top so the face stays in frame at any crop. The person's initials
 * sit underneath: they show while the photo loads, and in its place if there is none or it fails.
 */
export function StaffPhoto({ person, sizes, alt, className }: StaffPhotoProps) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : person.image;

  return (
    <div className={cx(s.photo, className)}>
      <span className={s.initials} aria-hidden="true">
        {initials(person.name)}
      </span>
      {src && (
        <Image
          src={src}
          alt={alt ?? `Portrait of ${person.name}`}
          fill
          sizes={sizes}
          draggable={false}
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
