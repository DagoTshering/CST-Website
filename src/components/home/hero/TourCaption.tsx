"use client";

import { pad2, stations } from "./clock";
import s from "./hero.module.css";
import { programmeColours } from "./palette";
import { useTourContext } from "./useTour";

/** Phones and tablets: which programme the dial shows, read out as it changes. */
export function TourCaption() {
  const { active } = useTourContext();
  const station = stations[active];

  return (
    <p className={s.caption} aria-live="polite" style={programmeColours(station.key)}>
      <span className={s.captionCount}>
        {pad2(active + 1)} / {pad2(stations.length)}
      </span>
      {` · ${station.year} · ${station.label}`}
    </p>
  );
}
