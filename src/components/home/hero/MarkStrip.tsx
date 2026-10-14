import type { CSSProperties } from "react";

import ds from "@/components/drawings/drawings.module.css";
import { MARKS } from "@/components/drawings/marks";
import { programmeColours } from "@/components/drawings/palette";
import type { Programme } from "@/content/home";

import s from "./hero.module.css";

/**
 * A legend row with a small moving mark for every programme, in the same order as the sheet.
 * It lights up in step with the tour; pointing at (or tapping) a mark brings that programme's
 * drawing up and names it underneath. engine.ts wires that up through the data attributes.
 */
export function MarkStrip({ programmes, label }: { programmes: Programme[]; label: string }) {
  return (
    <div className={s.marksWrap}>
      <ul className={s.marks} aria-label={label}>
        {programmes.map((p, order) => (
          <li
            key={p.key}
            className={`${ds.mark} ${s.mark}`}
            data-mark={p.key}
            style={{ ...programmeColours(p.key), "--order": order } as CSSProperties}
          >
            <span role="img" aria-label={`${p.title}, since ${p.year}`} className={ds.markFace}>
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
