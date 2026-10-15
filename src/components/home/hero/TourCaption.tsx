"use client";

import { pad2, stations } from "./clock";
import s from "./hero.module.css";
import { programmeColours } from "./palette";
import { useTourContext } from "./useTour";

/** Phones and tablets: which programme the dial shows, read out as it changes. */
export function TourCaption() {
  const { active } = useTourContext();
  const station = active < 0 ? null : stations[active];

  // empty (its height kept) until the tour reaches the first programme
  return (
    <p
      className={s.caption}
      aria-live="polite"
      style={station ? programmeColours(station.key) : undefined}
    >
      {station && (
        <>
          <span className={s.captionCount}>
            {pad2(active + 1)} / {pad2(stations.length)}
          </span>
          {` · ${station.year} · ${station.label}`}
        </>
      )}
    </p>
  );
}
