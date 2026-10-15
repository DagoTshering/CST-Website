import { hero, type Programme } from "@/content/home";

/**
 * The programme clock: every programme sits on one oval like the numbers on a clock face,
 * clockwise in the order they were first offered, starting top-left. Positions are worked
 * out here once, as plain numbers, so the server can place every station with CSS before any
 * JavaScript runs; the oval's radii (--rx, --ry) are left to the stylesheet.
 */

/** One beat of the tour. */
export const STEP_MS = 3000;
/** How long a programme the visitor picks holds the hand before the tour moves on. */
export const HOLD_MS = 12000;
/** When the tour starts, measured from the hero's first paint (the hand appears at 1.4s). */
export const TOUR_START_MS = 2300;

export type Station = Programme & {
  index: number;
  /** Angle from the centre in degrees, from -135 (top-left) clockwise. */
  theta: number;
  cos: number;
  sin: number;
  /**
   * 1 for the stations past 180°, where atan2() wraps round to negative angles. Adding a
   * turn keeps the hand's angle rising from station to station.
   */
  wrap: 0 | 1;
  /**
   * The stations at the top of the clock, whose full title has no room under the drawing on a
   * short screen (it would reach the copy), so it goes above instead.
   */
  above: boolean;
};

const round = (n: number) => Number(n.toFixed(4));

export const stations: Station[] = hero.programmes.map((programme, index, all) => {
  const theta = -135 + (index * 360) / all.length;
  const rad = (theta * Math.PI) / 180;
  return {
    ...programme,
    index,
    theta: round(theta),
    cos: round(Math.cos(rad)),
    sin: round(Math.sin(rad)),
    wrap: theta > 180 ? 1 : 0,
    above: Math.sin(rad) < -0.85,
  };
});

/**
 * Where the hand rests before the tour starts: in the gap just before the first programme, so
 * nothing is lit while the page loads and the first step lands on it.
 */
export const REST = (() => {
  const theta = stations[0].theta - 180 / stations.length;
  const rad = (theta * Math.PI) / 180;
  return { theta: round(theta), cos: round(Math.cos(rad)), sin: round(Math.sin(rad)), wrap: 0 };
})();

/** The station the hand points at, or its resting place (-1). */
export const pointOf = (active: number) => (active < 0 ? REST : stations[active]);

/** "2" -> "02" */
export const pad2 = (n: number) => String(n).padStart(2, "0");

export type HandPosition = {
  /** The active station, or -1 while the hand rests before the tour starts. */
  active: number;
  /** Whole turns the hand has made, so it never has to swing backwards. */
  laps: number;
};

/**
 * Where the hand ends up when it moves to station `to`. "forward" always goes clockwise (the
 * tour, gliding from the last programme on to the first); "nearest" takes the shorter way
 * round (a visitor picking a programme).
 */
export function moveHand(from: HandPosition, to: number, way: "forward" | "nearest"): HandPosition {
  if (to === from.active) return from;
  const now = pointOf(from.active).theta + 360 * from.laps;
  const target = stations[to].theta;
  // the most turns that still leave the target behind (or level with) the hand
  const behind = Math.floor((now - target) / 360);
  if (way === "forward") return { active: to, laps: behind + 1 };
  const back = now - (target + 360 * behind);
  return { active: to, laps: back <= 180 ? behind : behind + 1 };
}
