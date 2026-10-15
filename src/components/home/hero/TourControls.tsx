"use client";

import { pad2, stations } from "./clock";
import s from "./hero.module.css";
import { programmeColours } from "./palette";
import { useTourContext } from "./useTour";

/** Pauses and resumes the tour. */
export function TourToggle() {
  const { paused, toggle } = useTourContext();

  return (
    <button
      type="button"
      className={s.toggle}
      aria-label={paused ? "Play tour of programmes" : "Pause tour of programmes"}
      onClick={toggle}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true">
        {paused ? (
          <path d="M3 1.5L10.5 6L3 10.5Z" />
        ) : (
          <path d="M2.5 1.5h2.5v9H2.5ZM7 1.5h2.5v9H7Z" />
        )}
      </svg>
      <span className={s.toggleText}>{paused ? "Play tour" : "Pause tour"}</span>
    </button>
  );
}

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
