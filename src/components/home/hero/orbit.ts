/**
 * The orbit the programmes travel along: a closed oval |x/rx|^n + |y/ry|^n = 1 round the
 * centre of the sheet. n = 2 is an ellipse; a larger n is squarer, which keeps more room above
 * and below the copy on a short screen. The curve is sampled once so that a point can be found
 * by its distance along it, measured clockwise from the bottom; equal distances keep the
 * stations evenly spaced however wide the oval is.
 */

export type OrbitPoint = {
  x: number;
  y: number;
  /** The same point on a unit oval (-1 to 1 both ways). */
  ux: number;
  uy: number;
};

export type Orbit = {
  rx: number;
  ry: number;
  /** Its length. */
  total: number;
  /** The point `s` along the curve, clockwise from the bottom (any s; it wraps round). */
  at: (s: number) => OrbitPoint;
  /** The curve as an SVG path, centred on the origin. */
  path: string;
};

const SAMPLES = 720;

export function makeOrbit(rx: number, ry: number, n = 2): Orbit {
  const e = 2 / n;
  const ux: number[] = [];
  const uy: number[] = [];
  const lengths: number[] = [];
  for (let k = 0; k <= SAMPLES; k++) {
    const t = Math.PI / 2 + (k / SAMPLES) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    ux.push(Math.sign(c) * Math.abs(c) ** e);
    uy.push(Math.sign(s) * Math.abs(s) ** e);
    lengths.push(
      k ? lengths[k - 1] + Math.hypot(rx * (ux[k] - ux[k - 1]), ry * (uy[k] - uy[k - 1])) : 0,
    );
  }
  const total = lengths[SAMPLES];

  const at = (distance: number): OrbitPoint => {
    const s = ((distance % total) + total) % total;
    let lo = 0;
    let hi = SAMPLES;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] <= s) lo = mid;
      else hi = mid;
    }
    const f = (s - lengths[lo]) / (lengths[hi] - lengths[lo] || 1);
    const u = ux[lo] + (ux[hi] - ux[lo]) * f;
    const v = uy[lo] + (uy[hi] - uy[lo]) * f;
    return { x: rx * u, y: ry * v, ux: u, uy: v };
  };

  let path = "";
  for (let k = 0; k < SAMPLES; k += 4) {
    path += `${k ? "L" : "M"}${(rx * ux[k]).toFixed(1)} ${(ry * uy[k]).toFixed(1)}`;
  }

  return { rx, ry, total, at, path: `${path}Z` };
}
