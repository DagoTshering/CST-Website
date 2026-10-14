/**
 * Pure geometry for the hero drawing sheet. Nothing here is random, so the server and the
 * browser produce identical shapes.
 */

const round = (n: number, digits = 2) => Number(n.toFixed(digits));

/* ---------------------------------------------------------------------------
   Gear train
   Constant module m: pitch radius m·z/2, addendum m(z+2)/2, root m(z−2.5)/2.
   Meshing wheels sit at centre distance m(z1+z2)/2 and turn at ratio −z1/z2.
   --------------------------------------------------------------------------- */

export type Gear = {
  z: number;
  cx: number;
  cy: number;
  /** Index of the gear this one meshes with, or null for the driver. */
  parent: number | null;
  /** Speed ratio to the parent (parent teeth / own teeth). */
  ratio: number;
  /** Rotation offset that keeps the teeth meshed, in degrees. */
  base: number;
  /** Root, pitch and addendum radii. */
  root: number;
  pitch: number;
  tip: number;
};

type GearSpec = { z: number; x?: number; y?: number; parent?: number; angle?: number };

export const GEAR_MODULE = 6.2;

const TRAIN_SPEC: GearSpec[] = [
  { z: 38, x: 0, y: 0 },
  { z: 17, parent: 0, angle: -54 },
  { z: 23, parent: 1, angle: 22 },
  { z: 11, parent: 2, angle: -64 },
  { z: 13, parent: 0, angle: 88 },
  { z: 28, parent: 4, angle: 41 },
];

/** A gear's outline as an SVG path centred on the origin. */
export function gearOutline(z: number, m: number) {
  const tip = (m * (z + 2)) / 2;
  const root = (m * (z - 2.5)) / 2;
  const step = (Math.PI * 2) / z;
  const profile: [number, number][] = [
    [0, root],
    [0.17, root],
    [0.3, tip],
    [0.53, tip],
    [0.66, root],
    [0.83, root],
  ];
  let d = "";
  for (let i = 0; i < z; i++) {
    profile.forEach(([t, r], k) => {
      const a = (i + t) * step;
      d += `${i + k === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    });
  }
  return `${d}Z`;
}

function layoutTrain(spec: GearSpec[], m: number) {
  const gears: Gear[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const s of spec) {
    let cx = s.x ?? 0;
    let cy = s.y ?? 0;
    let ratio = 1;
    let base = 0;
    if (s.parent !== undefined) {
      const p = gears[s.parent];
      const dist = (m * (p.z + s.z)) / 2;
      const a = ((s.angle ?? 0) * Math.PI) / 180;
      cx = p.cx + Math.cos(a) * dist;
      cy = p.cy + Math.sin(a) * dist;
      ratio = p.z / s.z;
      base = (1 + ratio) * (s.angle ?? 0) + 180 / s.z; // half-tooth mesh offset
    }
    const tip = (m * (s.z + 2)) / 2;
    minX = Math.min(minX, cx - tip);
    maxX = Math.max(maxX, cx + tip);
    minY = Math.min(minY, cy - tip);
    maxY = Math.max(maxY, cy + tip);
    gears.push({
      z: s.z,
      cx: round(cx),
      cy: round(cy),
      parent: s.parent ?? null,
      ratio,
      base,
      root: (m * (s.z - 2.5)) / 2,
      pitch: (m * s.z) / 2,
      tip,
    });
  }

  const pad = 16;
  const viewBox = {
    x: round(minX - pad),
    y: round(minY - pad),
    width: round(maxX - minX + pad * 2),
    height: round(maxY - minY + pad * 2),
  };
  return { gears, viewBox };
}

export const GEAR_TRAIN = layoutTrain(TRAIN_SPEC, GEAR_MODULE);

/**
 * Each gear's rotation in degrees when the driver has turned `driver` degrees. Parents always
 * come before their children, so one pass is enough.
 */
export function gearRotations(gears: Gear[], driver: number, out: number[] = []) {
  gears.forEach((g, i) => {
    out[i] = g.parent === null ? driver : g.base - g.ratio * out[g.parent];
  });
  return out;
}

/* ---------------------------------------------------------------------------
   Dpal be'u, the endless knot, set out on a 5×5 grid. Four warp and four weft
   strands return in pairs at the edge; at each crossing the strand passing
   underneath breaks, which makes it read as a weave.
   --------------------------------------------------------------------------- */

export const KNOT_PATH = (() => {
  const n = 4;
  const out = 0.5;
  const gap = 0.19;
  let d = "";
  const strand = (fixed: number, vertical: boolean) => {
    const segments: [number, number][] = [];
    let from = out;
    for (let k = 1; k <= n; k++) {
      const under = vertical ? (fixed + k) % 2 === 0 : (fixed + k) % 2 === 1;
      if (under) {
        segments.push([from, k - gap]);
        from = k + gap;
      }
    }
    segments.push([from, n + out]);
    for (const [a, b] of segments) {
      d += vertical ? `M${fixed} ${a}V${b}` : `M${a} ${fixed}H${b}`;
    }
  };
  for (let i = 1; i <= n; i++) {
    strand(i, true);
    strand(i, false);
  }
  for (const [a, b] of [
    [1, 2],
    [3, 4],
  ]) {
    const r = (b - a) / 2;
    d += `M${a} ${out}A${r} ${r} 0 0 1 ${b} ${out}`;
    d += `M${a} ${n + out}A${r} ${r} 0 0 0 ${b} ${n + out}`;
    d += `M${out} ${a}A${r} ${r} 0 0 0 ${out} ${b}`;
    d += `M${n + out} ${a}A${r} ${r} 0 0 1 ${n + out} ${b}`;
  }
  return d;
})();

/* ---------------------------------------------------------------------------
   Small path helpers
   --------------------------------------------------------------------------- */

/** A sine wave from x0 to x1 sampled every `step`, with `cycles` periods. */
export function sinePath(
  x0: number,
  x1: number,
  y: number,
  amplitude: number,
  cycles: number,
  phase = 0,
  step = 3,
) {
  let d = "";
  for (let x = x0; x <= x1; x += step) {
    const yy = y - Math.sin(((x - x0) / (x1 - x0)) * Math.PI * 2 * cycles + phase) * amplitude;
    d += `${x === x0 ? "M" : "L"}${x} ${yy.toFixed(1)}`;
  }
  return d;
}

/** Points evenly spaced on a circle, as [x, y] pairs, starting at `startDeg`. */
export function polar(cx: number, cy: number, r: number, degrees: number[]) {
  return degrees.map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [round(cx + r * Math.cos(a), 1), round(cy + r * Math.sin(a), 1)] as const;
  });
}
