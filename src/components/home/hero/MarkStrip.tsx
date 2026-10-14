import type { Programme } from "@/content/home";

import s from "./hero.module.css";
import { MARKS } from "./marks";
import { programmeColours } from "./palette";

/**
 * A legend row with a small moving mark for every programme. Pointing at (or tapping) a mark
 * brings up that programme's drawing on the sheet and names it underneath; engine.ts wires
 * that up through the data attributes.
 */
export function MarkStrip({ programmes, label }: { programmes: Programme[]; label: string }) {
  return (
    <div className={s.marksWrap}>
      <ul className={s.marks} aria-label={label}>
        {programmes.map((p) => (
          <li key={p.key} className={s.mark} data-mark={p.key} style={programmeColours(p.key)}>
            <span role="img" aria-label={`${p.title}, since ${p.year}`} className={s.markFace}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {MARKS[p.key]}
              </svg>
            </span>
          </li>
        ))}
      </ul>
      <p className={s.markLabel} data-mark-label="" aria-hidden="true" />
    </div>
  );
}
