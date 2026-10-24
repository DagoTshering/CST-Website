"use client";

import Image from "next/image";
import { useState } from "react";

import { partnerInitials, type Partner } from "@/content/partners";
import { cx } from "@/lib/cx";

import s from "./Partners.module.css";

/**
 * A partner's logo on a white tile, or, without one, their initials on a tile tinted by their
 * type. The initials sit underneath the logo, so they also show while it loads and in its place
 * if it fails: the page never shows a broken image. `small` is the closed group's row of logos.
 */
export function PartnerLogo({ partner, small = false }: { partner: Partner; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : partner.logo;
  const letters = partnerInitials(partner.name);

  return (
    <span
      className={cx(s.logo, small && s.logoSmall)}
      data-type={partner.type}
      data-long={letters.length > 2 || undefined}
      data-loaded={src ? "" : undefined}
    >
      <span className={s.initials} aria-hidden="true">
        {letters}
      </span>
      {src && (
        <Image
          src={src}
          alt={small ? "" : `${partner.name} logo`}
          fill
          sizes={small ? "28px" : "64px"}
          draggable={false}
          className={s.logoImage}
          onError={() => setFailed(true)}
          // a logo that failed before hydration has no onError left to fire
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
        />
      )}
    </span>
  );
}
