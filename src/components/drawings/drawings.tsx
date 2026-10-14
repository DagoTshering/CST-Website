import type { ReactNode } from "react";

import type { ProgrammeKey } from "@/content/home";

import { sinePath } from "./geometry";
import s from "./drawings.module.css";

/**
 * The detail drawing for each programme, one small engineering sketch apiece. Mechanical has
 * none: the gear train is its drawing. Line weights and type come from the stylesheet, so only
 * geometry and opacity live here.
 *
 *   ln   drawing ink       g    the programme's colour (strokes)
 *   gf   colour fill       sf   ink fill        tx  label text
 */

type Drawing = { viewBox: string; content: ReactNode };

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

/* Warren truss under point loads ------------------------------------------- */
function civil(): Drawing {
  const L = 14;
  const R = 286;
  const top = 32;
  const bot = 76;
  const bays = 6;
  const step = (R - L) / bays;
  const bayX = Array.from({ length: bays }, (_, i) => L + i * step);
  const diagonals = bayX
    .map(
      (x) =>
        `M${x.toFixed(1)} ${bot} L${(x + step / 2).toFixed(1)} ${top} L${(x + step).toFixed(1)} ${bot}`,
    )
    .join(" ");
  return {
    viewBox: "0 0 300 100",
    content: (
      <>
        <path className={s.ln} d={`M${L} ${top} H${R} M${L} ${bot} H${R}`} />
        <path className={s.ln} d={diagonals} />
        {[...bayX, R].map((x) => (
          <circle
            key={`b${x}`}
            className={`${s.ln} ${s.node}`}
            cx={x.toFixed(1)}
            cy={bot}
            r={2.4}
          />
        ))}
        {bayX.map((x) => (
          <circle
            key={`t${x}`}
            className={`${s.ln} ${s.node}`}
            cx={(x + step / 2).toFixed(1)}
            cy={top}
            r={2.4}
          />
        ))}
        <path className={s.ln} d={`M${L} ${bot} l-7 12 h14 Z M${L - 11} 90 h22`} />
        <circle className={s.ln} cx={R} cy={bot + 6} r={5} />
        <path className={s.ln} d={`M${R - 11} 90 h22`} />
        {[1, 3, 5].map((k, i) => {
          const x = (L + (k - 0.5) * step).toFixed(1);
          const arrow = `M${x} 6 V26 M${(+x - 4).toFixed(1)} 20 L${x} 26 L${(+x + 4).toFixed(1)} 20`;
          return (
            <g key={k} className={s.load} style={delay(i * 0.18)}>
              {/* a pale halo under each load arrow, so white still reads on white */}
              <path className={`${s.ln} ${s.halo}`} d={arrow} strokeOpacity={0.9} />
              <path className={s.g} d={arrow} />
            </g>
          );
        })}
        <text className={s.tx} x={150} y={97} textAnchor="middle" opacity={0.8}>
          SPAN 24.0 m · W 18 kN
        </text>
      </>
    ),
  };
}

/* Three-phase supply on an oscilloscope -------------------------------------- */
function elec(): Drawing {
  let grid = "";
  for (let x = 8; x <= 192; x += 23) grid += `M${x} 8 V84`;
  for (let y = 8; y <= 84; y += 19) grid += `M8 ${y} H192`;
  const wave = (phase: number) => sinePath(8, 192, 46, 28, 2, phase);
  return {
    viewBox: "0 0 200 110",
    content: (
      <>
        <rect className={s.ln} x={8} y={8} width={184} height={76} strokeOpacity={0.65} />
        <path className={s.ln} d={grid} strokeOpacity={0.15} />
        <path className={s.ln} d="M8 46 H192" strokeOpacity={0.4} strokeDasharray="5 4" />
        <path className={s.ln} d={wave(0)} strokeOpacity={0.45} />
        <path className={s.ln} d={wave(2.094)} strokeOpacity={0.26} />
        <path className={s.g} d={wave(4.189)} />
        <path className={`${s.g} ${s.sweep}`} d="M8 8 V84" strokeOpacity={0.6} />
        <text className={s.tx} x={8} y={101} opacity={0.85}>
          3Ø 400 V 50 Hz
        </text>
        <path
          className={s.ln}
          d="M168 94 h20 M171 98 h14 M175 102 h6 M178 90 v4"
          strokeOpacity={0.65}
        />
      </>
    ),
  };
}

/* Microcontroller on gold-plated traces ------------------------------------- */
function ece(): Drawing {
  const rows = [0, 1, 2, 3, 4];
  const traces = rows.flatMap((i) => {
    const y = 52 + i * 12;
    return [
      `M86 ${y} H${66 - i * 7} L${52 - i * 7} ${y - 14 + i * 6} H${14 + i * 4}`,
      `M180 ${y} H${196 + i * 7} L${212 + i * 7} ${y + 16 - i * 6} H${248 - i * 4}`,
    ];
  });
  return {
    viewBox: "0 0 260 152",
    content: (
      <>
        <rect className={s.ln} x={96} y={44} width={74} height={60} rx={3} />
        <path className={s.ln} d="M96 60 A8 8 0 0 0 96 76" />
        <circle className={s.sf} cx={106} cy={96} r={2} />
        <text className={s.tx} x={133} y={70} textAnchor="middle">
          MCU
        </text>
        <text className={s.tx} x={133} y={82} textAnchor="middle" opacity={0.7}>
          32-BIT
        </text>
        {rows.map((i) => (
          <path key={i} className={s.ln} d={`M96 ${52 + i * 12} h-10 M170 ${52 + i * 12} h10`} />
        ))}
        {traces.map((d, i) => (
          <g key={d}>
            <path className={s.g} d={d} strokeOpacity={0.36} />
            <path className={`${s.g} ${s.pulse}`} d={d} style={delay(i * 0.22)} />
          </g>
        ))}
        {[
          [14, 38],
          [248, 110],
          [18, 86],
          [244, 58],
        ].map(([cx, cy]) => (
          <circle key={`${cx}`} className={s.g} cx={cx} cy={cy} r={2.6} />
        ))}
        <rect className={s.ln} x={118} y={116} width={24} height={9} rx={4.5} />
        <path className={s.ln} d="M118 120.5 h-14 M142 120.5 h14" />
        <text className={s.tx} x={130} y={138} textAnchor="middle" opacity={0.75}>
          16 MHz
        </text>
        <path className={s.ln} d="M186 116 v14 M180 122 h12 M180 126 h12" strokeOpacity={0.75} />
      </>
    ),
  };
}

/* An embedded control loop, as code ----------------------------------------- */
function it(): Drawing {
  // [text, highlighted?]
  const lines: [string, boolean][][] = [
    [["void loop() {", false]],
    [
      ["  adc = read(", false],
      ["A0", true],
      [");", false],
    ],
    [["  err = set - adc;", false]],
    [
      ["  u   = ", false],
      ["kp", true],
      ["*err + ", false],
      ["ki", true],
      ["*I;", false],
    ],
    [
      ["  pwm(", false],
      ["D9", true],
      [", clamp(u));", false],
    ],
    [["}", false]],
  ];
  return {
    viewBox: "0 0 230 128",
    content: (
      <>
        <path className={s.ln} d="M22 8 V118" strokeOpacity={0.35} />
        <rect className={`${s.gf} ${s.runbar}`} x={24} y={22} width={198} height={12} />
        {lines.map((parts, i) => {
          const y = 32 + i * 15;
          return (
            <g key={y}>
              <text className={`${s.tx} ${s.mono}`} x={14} y={y} textAnchor="end" opacity={0.4}>
                {i + 1}
              </text>
              <text className={`${s.tx} ${s.mono}`} x={28} y={y} xmlSpace="preserve">
                {parts.map(([text, live], k) => (
                  <tspan key={k} className={live ? s.live : undefined}>
                    {text}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
        <rect className={`${s.gf} ${s.caret}`} x={150} y={85} width={5} height={11} />
      </>
    ),
  };
}

/* Orthographic plan fragment with a swinging door --------------------------- */
function arch(): Drawing {
  return {
    viewBox: "0 0 200 132",
    content: (
      <>
        <path className={s.ln} d="M10 14 H150 M10 14 V110 M10 110 H150 M150 14 V60 M150 82 V110" />
        <path
          className={s.ln}
          d="M17 21 H143 M17 21 V103 M17 103 H143 M143 21 V60 M143 82 V110"
          strokeOpacity={0.6}
        />
        <path className={s.ln} d="M62 14 H104 M62 17.5 H104 M62 21 H104" strokeOpacity={0.75} />
        <circle className={s.ln} cx={52} cy={64} r={5} />
        <path
          className={s.ln}
          d="M52 53 V75 M41 64 H63"
          strokeDasharray="7 2 1.5 2"
          strokeOpacity={0.5}
        />
        <path
          className={s.ln}
          d="M150 60 A22 22 0 0 1 172 82"
          strokeDasharray="3 3"
          strokeOpacity={0.5}
        />
        <g className={s.door}>
          <path className={s.g} d="M150 60 V82" />
        </g>
        <path
          className={s.ln}
          d="M10 122 H150 M10 117 V127 M150 117 V127 M15 119 L10 122 L15 125 M145 119 L150 122 L145 125"
          strokeOpacity={0.5}
        />
        <text className={s.tx} x={80} y={119} textAnchor="middle">
          6.40 m
        </text>
      </>
    ),
  };
}

/* A turbine turning beside a PV array -------------------------------------- */
function renew(): Drawing {
  const blades = [-90, 30, 150].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `M112 47.5 L${(112 + 30 * Math.cos(a)).toFixed(1)} ${(47.5 + 30 * Math.sin(a)).toFixed(1)}`;
  });
  let cells = "";
  for (let i = 1; i < 4; i++) cells += `M${10 + i * 11} 118 L${26 + i * 11} 90 `;
  cells += "M18 104 H62";
  return {
    viewBox: "0 0 200 140",
    content: (
      <>
        {/* the tower stands right of the array, so the swept circle never reaches the panel */}
        <path className={s.ln} d="M121 118 V52 M112 118 h18" />
        <rect className={s.ln} x={112} y={43} width={22} height={9} rx={3} />
        <g className={s.rotor}>
          {blades.map((d) => (
            <path key={d} className={s.g} d={d} strokeLinecap="round" />
          ))}
          <circle className={`${s.ln} ${s.node}`} cx={112} cy={47.5} r={3.2} />
        </g>
        <path className={s.ln} d="M10 118 L26 90 H70 L54 118 Z" />
        <path className={s.ln} d={cells} strokeOpacity={0.55} />
        <path className={s.ln} d="M14 118 v8 M50 118 v8 M8 126 h48" strokeOpacity={0.5} />
        <path
          className={`${s.g} ${s.pulse}`}
          d="M26 60 L33 78 M44 54 L51 72"
          strokeLinecap="round"
        />
        <text className={`${s.tx} ${s.mono}`} x={20} y={136} fillOpacity={0.6}>
          TILT 27°
        </text>
        <path className={s.ln} d="M138 100 H194" strokeOpacity={0.45} />
        <text className={`${s.tx} ${s.mono}`} x={166} y={96} textAnchor="middle">
          2.1 MW
        </text>
        <text className={`${s.tx} ${s.mono}`} x={166} y={114} textAnchor="middle">
          CF 18.6%
        </text>
      </>
    ),
  };
}

/* Strata section with a fault and a borehole -------------------------------- */
function geo(): Drawing {
  const left = Array.from({ length: 8 }, (_, i) => 14 + i * 11);
  const right = Array.from({ length: 8 }, (_, i) => 118 + i * 11);
  return {
    viewBox: "0 0 210 124",
    content: (
      <>
        {[20, 42, 64, 88, 110].map((y, i) => (
          <path
            key={y}
            className={s.ln}
            d={`M8 ${y} L96 ${y + 7} M112 ${y + 16} L202 ${y + 23}`}
            strokeOpacity={i === 0 ? 0.9 : 0.55}
          />
        ))}
        <path className={s.ln} d="M96 8 L112 118" strokeDasharray="7 3" />
        {left.map((x) => (
          <g key={x}>
            <circle className={s.sf} cx={x} cy={29 + (x - 14) * 0.08} r={1.1} opacity={0.5} />
            <path
              className={s.ln}
              d={`M${x} ${51 + (x - 14) * 0.08} h6 M${x} ${74 + (x - 14) * 0.08} l4 -4`}
              strokeOpacity={0.32}
            />
          </g>
        ))}
        {right.map((x) => (
          <g key={x}>
            <circle className={s.sf} cx={x} cy={47 + (x - 118) * 0.08} r={1.1} opacity={0.5} />
            <path className={s.ln} d={`M${x} ${69 + (x - 118) * 0.08} h6`} strokeOpacity={0.32} />
          </g>
        ))}
        <path className={s.ln} d="M156 16 h28 M156 16 l22 9" strokeOpacity={0.7} />
        <text className={`${s.tx} ${s.live}`} x={186} y={15}>
          24°
        </text>
        <path className={s.g} d="M56 4 V114" strokeDasharray="4 3" strokeOpacity={0.8} />
        <g className={s.bit}>
          <path className={s.g} d="M50 10 h12 M52 14 h8 M56 10 v8" />
        </g>
        <text className={s.tx} x={8} y={122} opacity={0.7}>
          BH-04 · TD 32.0 m
        </text>
      </>
    ),
  };
}

/* A level control loop, drawn as a P&ID ------------------------------------- */
function inst(): Drawing {
  const hatch = Array.from({ length: 7 }, (_, i) => 26 + i * 9);
  return {
    viewBox: "0 0 240 132",
    content: (
      <>
        <path className={s.ln} d="M22 34 V112 H86 V34" />
        <path className={s.ln} d="M22 34 H86" strokeOpacity={0.35} strokeDasharray="4 3" />
        <path className={s.g} d="M22 62 H86" />
        {hatch.map((x) => (
          <path key={x} className={s.ln} d={`M${x} 62 l-4 8`} strokeOpacity={0.28} />
        ))}
        {(
          [
            [116, 62, "LT"],
            [164, 30, "LIC"],
          ] as const
        ).map(([cx, cy, tag]) => (
          <g key={tag}>
            <circle className={`${s.ln} ${s.paper}`} cx={cx} cy={cy} r={13} fillOpacity={0.55} />
            <path className={s.ln} d={`M${cx - 13} ${cy} h26`} strokeOpacity={0.4} />
            <text className={s.tx} x={cx} y={cy - 1} textAnchor="middle">
              {tag}
            </text>
          </g>
        ))}
        {/* electrical signal lines are dashed, per ISA */}
        <path className={s.ln} d="M86 62 H103" />
        <path
          className={s.ln}
          d="M129 62 C 150 62, 164 56, 164 43"
          strokeDasharray="5 3"
          strokeOpacity={0.7}
        />
        <path
          className={s.ln}
          d="M164 17 C 164 8, 210 8, 210 46 V 84"
          strokeDasharray="5 3"
          strokeOpacity={0.7}
        />
        <path className={`${s.g} ${s.pulse}`} d="M86 62 H103 M129 62 C 150 62, 164 56, 164 43" />
        <path
          className={`${s.g} ${s.pulse}`}
          d="M164 17 C 164 8, 210 8, 210 46 V 84"
          style={delay(0.9)}
        />
        <g className={s.stem}>
          <rect className={s.ln} x={201} y={80} width={18} height={8} rx={4} />
          <path className={s.ln} d="M210 88 V96" />
        </g>
        <path className={s.ln} d="M200 96 L220 108 L220 96 L200 108 Z" />
        <path className={s.ln} d="M200 102 H150 V112 H86" strokeOpacity={0.8} />
        <text className={s.tx} x={22} y={126} opacity={0.7}>
          LEVEL CONTROL LOOP
        </text>
      </>
    ),
  };
}

/* The programme as a bar chart, with the data date sweeping across --------- */
function constr(): Drawing {
  const rows: [number, number, string][] = [
    [30, 66, "A"],
    [52, 88, "B"],
    [80, 56, "C"],
    [104, 72, "D"],
    [132, 44, "E"],
  ];
  let ticks = "";
  for (let i = 1; i <= 5; i++) ticks += `M${24 + i * 30} 112 v4 `;
  return {
    viewBox: "0 0 200 132",
    content: (
      <>
        <path className={s.ln} d="M24 16 V112 M24 112 H190" />
        <path className={s.ln} d={ticks} strokeOpacity={0.5} />
        {rows.map(([x, w, label], i) => {
          const y = 24 + i * 17;
          return (
            <g key={label}>
              <rect
                className={s.ln}
                x={x}
                y={y}
                width={w}
                height={9}
                rx={1.5}
                strokeOpacity={0.7}
              />
              <rect
                className={s.gf}
                x={x}
                y={y}
                width={(w * (0.92 - i * 0.17)).toFixed(1)}
                height={9}
                rx={1.5}
              />
              <text className={`${s.tx} ${s.mono}`} x={16} y={y + 7.5} textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
        <g className={s.gsweep}>
          <path className={s.g} d="M32 18 V112" strokeDasharray="4 3" />
          <path className={s.gf} d="M27.5 18 h9 l-4.5 6 Z" />
        </g>
        <text className={`${s.tx} ${s.mono}`} x={107} y={126} textAnchor="middle">
          WK 1 – 24
        </text>
      </>
    ),
  };
}

/* Broad-crested weir in section --------------------------------------------- */
function water(): Drawing {
  const hatch = Array.from({ length: 4 }, (_, i) => 102 + i * 7);
  return {
    viewBox: "0 0 230 122",
    content: (
      <>
        <path className={s.ln} d="M8 104 H222" />
        <path className={s.ln} d="M100 46 H128 V104" />
        {hatch.map((x) => (
          <path key={x} className={s.ln} d={`M${x} 104 l6 -8`} strokeOpacity={0.3} />
        ))}
        <path className={s.g} d="M8 34 H100" />
        <path className={s.g} d="M52 30 l5 -6 h-10 Z M45 32 h14" />
        <path
          className={s.ln}
          d="M80 34 V46 M76 38 L80 34 L84 38 M76 42 L80 46 L84 42"
          strokeOpacity={0.6}
        />
        <text className={s.tx} x={88} y={44} opacity={0.8}>
          H
        </text>
        {/* the nappe as it springs off the crest */}
        <path className={s.g} d="M128 46 C 150 46, 156 66, 152 104" />
        <path className={s.g} d="M152 86 C 168 80, 178 92, 192 86 H222" strokeOpacity={0.85} />
        {[46, 62, 78].map((y, i) => (
          <g key={y} className={s.drift} style={delay(i * 0.5)}>
            <path className={s.g} d={`M16 ${y} h26 M36 ${y - 3} l6 3 l-6 3`} strokeOpacity={0.55} />
          </g>
        ))}
        <text className={s.tx} x={8} y={118} opacity={0.75}>
          Q = 3.60 m³/s · Cd 0.62
        </text>
      </>
    ),
  };
}

/* A branch-and-merge graph -------------------------------------------------- */
function soft(): Drawing {
  return {
    viewBox: "0 0 230 130",
    content: (
      <>
        <path className={s.ln} d="M34 12 V122" strokeOpacity={0.75} />
        <path
          className={s.ln}
          d="M34 38 C 58 38, 84 38, 84 56 V 78 C 84 96, 58 96, 34 96"
          strokeOpacity={0.6}
        />
        <path
          className={s.ln}
          d="M34 64 C 80 64, 128 64, 128 84 V 116"
          strokeOpacity={0.45}
          strokeDasharray="4 3"
        />
        <path className={`${s.g} ${s.pulse}`} d="M34 12 V122" />
        {[12, 38, 64, 96, 122].map((cy) => (
          <circle key={cy} className={`${s.ln} ${s.paper}`} cx={34} cy={cy} r={3.4} />
        ))}
        <circle className={s.gf} cx={34} cy={96} r={1.6} />
        {[
          [84, 56],
          [84, 78],
          [128, 84],
          [128, 116],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            className={`${s.ln} ${s.paper}`}
            cx={cx}
            cy={cy}
            r={2.8}
            strokeOpacity={0.7}
          />
        ))}
        <circle className={`${s.gf} ${s.head}`} cx={34} cy={122} r={2.2} />
        <text className={s.tx} x={48} y={15} opacity={0.85}>
          main
        </text>
        <text className={s.tx} x={96} y={53} opacity={0.7}>
          feat/api
        </text>
        <text className={s.tx} x={140} y={119} opacity={0.55}>
          release/2.4
        </text>
        <text className={s.tx} x={48} y={99} opacity={0.6}>
          merge
        </text>
      </>
    ),
  };
}

/* Observations, error bars and a fitted line -------------------------------- */
function resrch(): Drawing {
  let ticks = "";
  for (let i = 1; i <= 4; i++) ticks += `M26 ${106 - i * 20} h-4 `;
  for (let j = 1; j <= 6; j++) ticks += `M${26 + j * 25} 106 v4 `;
  const points = [
    [44, 98],
    [68, 90],
    [92, 78],
    [116, 68],
    [140, 56],
    [164, 44],
  ];
  return {
    viewBox: "0 0 200 132",
    content: (
      <>
        <path className={s.ln} d="M26 16 V106 M26 106 H186" />
        <path className={s.ln} d={ticks} strokeOpacity={0.5} />
        <path className={s.ln} d="M32 94 L180 32" strokeDasharray="4 3" strokeOpacity={0.4} />
        <path className={s.ln} d="M32 110 L180 48" strokeDasharray="4 3" strokeOpacity={0.4} />
        <path className={s.g} d="M32 102 L180 40" />
        {points.map(([x, y], i) => (
          <g key={x}>
            <path
              className={s.ln}
              d={`M${x} ${y - 6} v12 M${x - 3.2} ${y - 6} h6.4 M${x - 3.2} ${y + 6} h6.4`}
              strokeOpacity={0.5}
            />
            <circle
              className={`${s.ln} ${s.node} ${i === 3 ? s.head : ""}`}
              cx={x}
              cy={y}
              r={2.6}
            />
          </g>
        ))}
        <text className={`${s.tx} ${s.mono}`} x={107} y={124} textAnchor="middle">
          R² = 0.94
        </text>
      </>
    ),
  };
}

export const DRAWINGS: Record<Exclude<ProgrammeKey, "mech">, Drawing> = {
  civil: civil(),
  elec: elec(),
  ece: ece(),
  it: it(),
  arch: arch(),
  renew: renew(),
  geo: geo(),
  inst: inst(),
  constr: constr(),
  water: water(),
  soft: soft(),
  resrch: resrch(),
};
