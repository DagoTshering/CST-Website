import type { ReactNode } from "react";

import type { ProgrammeKey } from "@/content/home";

import { gearOutline, polar, sinePath } from "./geometry";
import s from "./hero.module.css";

/**
 * The small mark for each programme, on a 24px grid, shown in the middle of the phone dial.
 * `mk` strokes in the programme's ink, `mkf` fills in its colour.
 */

const spokes = polar(12, 12, 8, [-90, 30, 150]);

export const MARKS: Record<ProgrammeKey, ReactNode> = {
  renew: (
    <>
      <path className={s.mk} d="M12 13 V21 M9 21 h6" strokeOpacity={0.7} />
      <g>
        {spokes.map(([x, y]) => (
          <path key={`${x}`} className={s.mk} d={`M12 12 L${x} ${y}`} />
        ))}
      </g>
      <circle className={s.mkf} cx={12} cy={12} r={1.5} />
      <path className={s.mk} d="M3 6 L5.5 9 M20 5 L17.5 8" strokeOpacity={0.45} />
    </>
  ),
  constr: (
    <>
      <path className={s.mk} d="M4 20 H21" strokeOpacity={0.7} />
      <rect className={s.mk} x={5} y={6} width={9} height={3} rx={1} strokeOpacity={0.75} />
      <rect className={s.mk} x={8} y={11} width={10} height={3} rx={1} strokeOpacity={0.75} />
      <rect className={s.mk} x={6} y={16} width={7} height={3} rx={1} strokeOpacity={0.75} />
      <g>
        <path className={s.mk} d="M12 4 V21" />
      </g>
    </>
  ),
  resrch: (
    <>
      <path className={s.mk} d="M5 4 V19 M5 19 H21" strokeOpacity={0.7} />
      <path className={s.mk} d="M7 17 L20 7" />
      <circle className={s.mkf} cx={8} cy={16} r={1.3} />
      <circle className={s.mkf} cx={12} cy={13} r={1.3} />
      <circle className={s.mkf} cx={16} cy={10} r={1.3} />
      <circle className={s.mkf} cx={19} cy={8} r={1.6} />
    </>
  ),
  arch: (
    <>
      <path className={s.mk} d="M4 7 H20 V19 H4 Z" />
      <path className={s.mk} d="M9 7 H15" strokeOpacity={0.5} />
      <path
        className={s.mk}
        d="M17 18 A7 7 0 0 0 10 11"
        strokeDasharray="2 2"
        strokeOpacity={0.5}
      />
      <g>
        <path className={s.mk} d="M17 18 V11" />
      </g>
    </>
  ),
  civil: (
    <>
      <path className={s.mk} d="M3 18 H21 M3 10 H21" strokeOpacity={0.75} />
      <path className={s.mk} d="M3 18 L7.5 10 L12 18 L16.5 10 L21 18" />
      <g>
        <path className={s.mk} d="M12 2 V8 M9.6 6 L12 8.4 L14.4 6" />
      </g>
    </>
  ),
  elec: (
    <>
      <path className={s.mk} d={sinePath(2, 22, 12, 6.5, 1, 0, 1)} strokeOpacity={0.42} />
      <path className={s.mk} d={sinePath(2, 22, 12, 6.5, 1, 0, 1)} />
    </>
  ),
  ece: (
    <>
      <rect className={s.mk} x={8} y={8} width={8} height={8} rx={1} />
      <path
        className={s.mk}
        d="M8 10 H4 M8 14 H4 M16 10 H20 M16 14 H20 M10 8 V4 M14 8 V4 M10 16 V20 M14 16 V20"
        strokeOpacity={0.6}
      />
      <path className={s.mk} d="M4 10 H8 M16 14 H20" />
      <circle className={s.mkf} cx={9.4} cy={14.6} r={0.9} />
    </>
  ),
  it: (
    <>
      <rect className={s.mk} x={3} y={5} width={18} height={14} rx={1} />
      <path className={s.mk} d="M6.5 10 L9 12 L6.5 14" />
      <rect className={s.mkf} x={11} y={9.5} width={2.2} height={5} />
    </>
  ),
  soft: (
    <>
      <path className={s.mk} d="M8 3 V21" strokeOpacity={0.6} />
      <path className={s.mk} d="M8 9 C 15 9, 17 11, 17 16 V19" strokeOpacity={0.6} />
      <path className={s.mk} d="M8 3 V21" />
      <circle className={s.mk} cx={8} cy={3} r={2} />
      <circle className={s.mk} cx={8} cy={15} r={2} />
      <circle className={s.mk} cx={17} cy={19} r={2} />
    </>
  ),
  inst: (
    <>
      <circle className={s.mk} cx={12} cy={13} r={8.5} />
      <path className={s.mk} d="M12 4.5 V6.5 M20.5 13 H18.5 M3.5 13 H5.5" strokeOpacity={0.55} />
      <g>
        <path className={s.mk} d="M12 13 V6" />
      </g>
      <circle className={s.mkf} cx={12} cy={13} r={1.2} />
    </>
  ),
  mech: (
    <g>
      <path className={s.mk} d={gearOutline(9, 2.05)} transform="translate(12 12)" />
      <circle className={s.mk} cx={12} cy={12} r={2.4} />
    </g>
  ),
  geo: (
    <>
      <path className={s.mk} d="M3 9 H21 M3 14 H21 M3 19 H21" strokeOpacity={0.65} />
      {[5, 9, 13, 17].map((x) => (
        <circle key={x} className={s.mkf} cx={x} cy={11.5} r={0.8} opacity={0.45} />
      ))}
      <g>
        <path className={s.mk} d="M12 3 V11 M10 9 H14" />
      </g>
    </>
  ),
  water: (
    <>
      <path className={s.mk} d={sinePath(3, 21, 16, 2.1, 1, 0, 1)} strokeOpacity={0.45} />
      <g>
        <path className={s.mk} d={sinePath(3, 21, 10.5, 2.6, 1, 0, 1)} />
      </g>
      <path className={s.mk} d="M3 20.5 H21" strokeOpacity={0.7} />
    </>
  ),
};
