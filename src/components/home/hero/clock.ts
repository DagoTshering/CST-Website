import { hero, type Programme } from "@/content/home";

import { makeOrbit } from "./orbit";

/**
 * The programme clock: every programme sits on one oval, clockwise in the order they were
 * first offered, spaced evenly along the curve. The stylesheet places each station from a
 * fallback position worked out here (for a typical laptop oval), so the server renders them in
 * place; in the browser Stations measures the real oval and the copy, and sets the stations
 * travelling slowly round it.
 */

/** One beat of the tour. */
export const STEP_MS = 3000;
/** How long a programme picked by tap or keyboard holds the tour before it moves on. */
export const HOLD_MS = 12000;
/** When the tour starts, measured from the hero's first paint (the stations are in by then). */
export const TOUR_START_MS = 1800;

/**
 * The station that starts at the bottom of the oval, under the buttons. The others fall
 * symmetrically either side of it, with a gap at the top above the eyebrow.
 */
const BOTTOM = 8;

/** The fallback oval's width to height, close to a laptop's. */
const FALLBACK_ASPECT = 2.8;

export type Station = Programme & {
  index: number;
  /** Direction on a circle in degrees, from -135 (top-left) clockwise: the phone dial's dots. */
  theta: number;
  /** Fallback position on the oval, as a share of its radii (x = rx·cos, y = ry·sin). */
  cos: number;
  sin: number;
  /** Fallback: the station is in the top half, so its name goes above the drawing. */
  above: boolean;
};

const round = (n: number) => Number(n.toFixed(4));

/**
 * Where station `index` starts, as a share of the way round the orbit, clockwise from the
 * bottom: the stations are spaced evenly, BOTTOM first.
 */
export const startShare = (index: number) => {
  const count = hero.programmes.length;
  return ((index - BOTTOM + count) % count) / count;
};

const fallback = makeOrbit(FALLBACK_ASPECT, 1);

export const stations: Station[] = hero.programmes.map((programme, index, all) => {
  const theta = -135 + (index * 360) / all.length;
  const point = fallback.at(startShare(index) * fallback.total);
  return {
    ...programme,
    index,
    theta: round(theta),
    cos: round(point.ux),
    sin: round(point.uy),
    above: point.uy < -0.3,
  };
});

/** "2" -> "02" */
export const pad2 = (n: number) => String(n).padStart(2, "0");
