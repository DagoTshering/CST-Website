"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";

import s from "./StudentHub.module.css";

/** At most this many photos per band (the photo script keeps no more either). */
const MAX_PHOTOS = 12;

const NARROW = "(max-width: 47.99rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A club's curved photo band. It only mounts (and only then fetches its photos) once its place
 * comes within 150px of the screen, and it pauses whenever it is further away than that, such as
 * on a phone scrolled down to the club's activities. Until it mounts, its frame keeps the band's
 * height, so nothing below moves when it appears. The band is decorative (aria-hidden); a line
 * of hidden text tells screen reader users it is there.
 */
export function ClubBand({ name, photos }: { name: string; photos: string[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [near, setNear] = useState(false);
  const narrow = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
  // The band preloads whatever it is given, so the list must keep its identity between renders.
  const images = useMemo(() => photos.slice(0, MAX_PHOTOS).map((src) => ({ src })), [photos]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "150px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} className={s.band}>
      <p className="sr-only">{name} photo gallery</p>
      {mounted && (
        <TiltedGridHero
          images={images}
          speed={4}
          tileHeight={52}
          axis={50}
          curve={80}
          fade={12}
          slices={narrow ? 10 : 16}
          paused={!near}
          className="h-full"
        />
      )}
    </div>
  );
}
