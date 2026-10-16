import s from "./hero.module.css";

/*
 * The monument-inspired ornament behind the copy, very faint: a globe lattice, a silver
 * figure-eight ribbon and a gold armillary ring (that one a little stronger, see Armillary). Each piece is drawn on a unit grid and
 * stretched to its size by the stylesheet (preserveAspectRatio="none", with strokes that do
 * not scale), so it fits any hero without measuring anything.
 */

/** A lemniscate of Bernoulli filling the box from -1 to 1 both ways. */
const RIBBON_PATH = (() => {
  const yScale = 0.3536; // the curve's own half-height when its half-width is 1
  let d = "";
  for (let k = 0; k <= 120; k++) {
    const t = (k / 120) * Math.PI * 2;
    const q = 1 + Math.sin(t) ** 2;
    const x = Math.cos(t) / q;
    const y = (Math.sin(t) * Math.cos(t)) / q / yScale;
    d += `${k ? "L" : "M"}${x.toFixed(4)} ${y.toFixed(4)}`;
  }
  return `${d}Z`;
})();

/** A hexagon of radius 11 with its inner triangle and spokes, centred on the origin. */
const POLY = (() => {
  const v = Array.from({ length: 6 }, (_, k) => {
    const a = ((60 * k - 90) * Math.PI) / 180;
    return [Number((11 * Math.cos(a)).toFixed(2)), Number((11 * Math.sin(a)).toFixed(2))];
  });
  return {
    hexagon: v.map((p) => p.join(",")).join(" "),
    triangle: [0, 2, 4].map((k) => v[k].join(",")).join(" "),
    spokes: [1, 3, 5].map((k) => `M0 0L${v[k][0]} ${v[k][1]}`).join(""),
  };
})();

function Gradients() {
  return (
    <defs>
      <linearGradient id="hero-gold" x1="0" x2="1">
        <stop offset="0" className={s.brassLight} />
        <stop offset="0.5" className={s.brass} />
        <stop offset="1" className={s.brassDeep} />
      </linearGradient>
      <linearGradient id="hero-silver" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" className={s.silver} />
        <stop offset="0.5" className={s.silverLight} />
        <stop offset="1" className={s.silver} />
      </linearGradient>
    </defs>
  );
}

export function Ornament() {
  return (
    <>
      <svg className={s.globe} viewBox="-1 -1 2 2" preserveAspectRatio="none">
        <circle r={1} />
        <ellipse rx={0.42} ry={1} />
        <ellipse rx={0.78} ry={1} />
        <ellipse rx={1} ry={0.28} />
        <ellipse rx={1} ry={0.6} />
        <path d="M-1 0H1" />
      </svg>

      <svg className={s.ribbon} viewBox="-1 -1 2 2" preserveAspectRatio="none">
        <Gradients />
        <path d={RIBBON_PATH} className={s.ribbonBand} stroke="url(#hero-silver)" />
        <path d={RIBBON_PATH} className={s.ribbonEdge} />
      </svg>
    </>
  );
}

/**
 * The brass armillary ring round the headline, with a deep-teal twin turned a few degrees so
 * the two cross. It sits above the copy's fog (HeroSheet places it), so it reads clearly while
 * the rest of the ornament stays faint.
 */
export function Armillary() {
  return (
    <svg className={s.armillary} viewBox="-1 -1 2 2" preserveAspectRatio="none">
      <ellipse rx={1} ry={1} className={s.armillaryGold} stroke="url(#hero-gold)" />
      <ellipse rx={1.03} ry={1.06} transform="rotate(5)" className={s.armillaryTeal} />
    </svg>
  );
}

/** The sheet border, with a small gold medallion (a polyhedron in a circle) at each corner. */
export function Frame() {
  return (
    <div className={s.frame}>
      <svg className={s.corners}>
        {[
          ["0", "0"],
          ["100%", "0"],
          ["0", "100%"],
          ["100%", "100%"],
        ].map(([x, y]) => (
          <svg key={`${x}${y}`} x={x} y={y} overflow="visible" stroke="url(#hero-gold)">
            <circle r={14} />
            <polygon points={POLY.hexagon} />
            <polygon points={POLY.triangle} />
            <path d={POLY.spokes} />
          </svg>
        ))}
      </svg>
    </div>
  );
}
