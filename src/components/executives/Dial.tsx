import type { Executive } from "@/content/executives";

import s from "./Executives.module.css";
import { Portrait } from "./Portrait";

/** The dial's 72 ticks, every sixth longer, drawn once: a degree ring like the emblem's. */
const TICKS = (() => {
  let minor = "";
  let major = "";
  for (let i = 0; i < 72; i++) {
    const long = i % 6 === 0;
    const angle = ((i * 5 - 90) * Math.PI) / 180;
    const [r1, r2] = [long ? 90 : 93, 97];
    const point = (r: number) =>
      `${(100 + r * Math.cos(angle)).toFixed(2)} ${(100 + r * Math.sin(angle)).toFixed(2)}`;
    const segment = `M${point(r1)}L${point(r2)}`;
    if (long) major += segment;
    else minor += segment;
  }
  return { minor, major };
})();

/**
 * A portrait as a dial, in the line work of the About emblem and the hero clock: a ring of tick
 * marks, a thin ring, a thick inner ring (brass for the President, teal for the Deans), a small
 * brass pointer at the top, and the photograph filling the middle. The line work is decorative.
 */
export function Dial({
  person,
  kind,
  sizes,
}: {
  person: Executive;
  kind: "president" | "dean";
  sizes: string;
}) {
  return (
    <div className={s.dial} data-kind={kind}>
      <Portrait person={person} sizes={sizes} />
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <path className={s.tick} d={TICKS.minor} />
        <path className={`${s.tick} ${s.tickMajor}`} d={TICKS.major} />
        <circle className={s.ring} cx="100" cy="100" r="86" />
        <circle className={s.innerRing} cx="100" cy="100" r="80" />
        <path className={s.pointer} d="M100 4l5-9h-10z" />
      </svg>
    </div>
  );
}
