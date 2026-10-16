"use client";

import type { ReactNode } from "react";

import { stations } from "./clock";
import s from "./hero.module.css";
import { programmeColours } from "./palette";
import { useTourContext } from "./useTour";

const C = 66; // centre of the 132×132 dial
const R = 54; // radius of the ring of dots

const dots = stations.map((station) => {
  const a = (station.theta * Math.PI) / 180;
  return {
    key: station.key,
    cx: (C + R * Math.cos(a)).toFixed(1),
    cy: (C + R * Math.sin(a)).toFixed(1),
  };
});

/**
 * Phones and tablets: the clock in miniature above the copy. A dot per programme round the
 * ring, in tour order, and the active programme's mark and year in the middle. The marks are
 * rendered on the server and passed in. Decorative: the caption under the buttons says the
 * same in words.
 */
export function MiniDial({ marks }: { marks: ReactNode[] }) {
  const { active } = useTourContext();
  const station = active < 0 ? null : stations[active];

  return (
    <div className={s.dial} aria-hidden="true">
      <svg viewBox="0 0 132 132">
        <circle className={s.dialFace} cx={C} cy={C} r={R} />
        <circle className={s.dialRing} cx={C} cy={C} r={42} />
        {dots.map((dot, i) => (
          <circle
            key={dot.key}
            className={s.dialDot}
            cx={dot.cx}
            cy={dot.cy}
            r={i === active ? 4 : 3}
            data-on={i === active ? "" : undefined}
            style={programmeColours(dot.key)}
          />
        ))}
        <circle className={s.dialHub} cx={C} cy={C} r={27} />
        {station && (
          <g style={programmeColours(station.key)}>
            <svg x={51} y={39} width={30} height={30} viewBox="0 0 24 24" overflow="visible">
              {marks[active]}
            </svg>
            <text className={s.dialYear} x={C} y={85} textAnchor="middle">
              {station.year}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
