"use client";

import type { CSSProperties, ReactNode } from "react";

import { stations } from "./clock";
import s from "./hero.module.css";
import { programmeColours } from "./palette";
import { useTourContext } from "./useTour";

/**
 * The programmes around the clock face, one button each, in tour order. Each is placed by the
 * stylesheet from its cos/sin, so the server renders them in position. The drawings are
 * rendered on the server and passed in. Clicking one (or Enter/Space) moves the hand there and
 * stops the tour; hovering does nothing.
 */
export function Stations({ drawings, label }: { drawings: ReactNode[]; label: string }) {
  const { active, pick } = useTourContext();

  return (
    <div className={s.ring} role="group" aria-label={label}>
      <div className={s.stage}>
        {stations.map((station, i) => (
          <button
            key={station.key}
            type="button"
            className={s.station}
            data-on={i === active ? "" : undefined}
            data-pg={station.postgraduate ? "" : undefined}
            data-above={station.above ? "" : undefined}
            aria-label={`${station.title}, since ${station.year}`}
            aria-current={i === active ? "true" : undefined}
            style={
              {
                ...programmeColours(station.key),
                "--cos": station.cos,
                "--sin": station.sin,
                "--i": i,
              } as CSSProperties
            }
            onClick={() => pick(i)}
          >
            {drawings[i]}
            <span className={s.year}>{station.year}</span>
            <span className={s.name}>{station.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
