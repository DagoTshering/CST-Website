import type { SVGProps } from "react";

/* ---------------------------------------------------------------------------
   Dpal be'u, the endless knot, set out on a 5×5 grid. Four warp and four weft
   strands return in pairs at the edge; at each crossing the strand passing
   underneath breaks, which makes it read as a weave.
   --------------------------------------------------------------------------- */

const KNOT_PATH = (() => {
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

/** The endless knot as a small ornament in the current text colour (the hero's corners). */
export function EndlessKnot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 5 5" aria-hidden="true" focusable="false" {...props}>
      <path
        d={KNOT_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
