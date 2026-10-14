import Image from "next/image";
import type { CSSProperties } from "react";

import { DRAWINGS } from "@/components/drawings/drawings";
import ds from "@/components/drawings/drawings.module.css";
import { GearTrain } from "@/components/drawings/GearTrain";
import { programmeColours } from "@/components/drawings/palette";
import { EndlessKnot } from "@/components/ui/EndlessKnot";
import { hero, type Programme } from "@/content/home";

import s from "./hero.module.css";

const KNOTS = ["tl", "tr", "bl", "br"] as const;

/** Colours for a programme, plus its place in the clockwise order (for the entrance). */
const plateStyle = (p: Programme, order: number) =>
  ({ ...programmeColours(p.key), "--order": order }) as CSSProperties;

/**
 * The hero's background: an engineering drawing sheet over a faint aerial photograph. Every
 * programme has a detail box on the sheet, laid out clockwise in the order the programmes
 * began: up the left side from 2001, across the top, down the right to the gear train
 * (Mechanical), and back along the bottom to 2027. Everything here is rendered on the server
 * and is complete without JavaScript; engine.ts animates it. The sheet is decorative, so it is
 * hidden from assistive technology (the legend strip names the programmes instead).
 *
 * Below 1240px the boxes share one slot and take turns in it; the server shows the first.
 */
export function HeroSheet({ programmes }: { programmes: Programme[] }) {
  const mechIndex = programmes.findIndex((p) => p.key === "mech");
  const mech = programmes[mechIndex];

  return (
    <div className={s.sheet} aria-hidden="true" data-sheet="">
      <div className={`${s.layer} ${s.photo}`} data-depth="0">
        <Image
          src={hero.underlay.src}
          alt=""
          fill
          preload
          sizes="100vw"
          className={s.photoImage}
          style={{ objectPosition: hero.underlay.focus }}
        />
      </div>
      <div className={`${s.layer} ${s.grid}`} data-depth="4" />
      <canvas className={`${s.layer} ${s.net}`} data-depth="9" data-net="" />

      <div className={s.cross}>
        <i className={s.crossH} data-cross-h="" />
        <i className={s.crossV} data-cross-v="" />
        <span className={s.crossTag} data-cross-tag="" />
      </div>

      <div className={s.stage}>
        <div className={`${s.layer} ${s.plates}`} data-depth="15">
          {programmes.map((p, order) => {
            if (p.key === "mech") return null;
            const drawing = DRAWINGS[p.key];
            return (
              <figure
                key={p.key}
                className={`${s.plate} ${ds.drawing}`}
                data-prog={p.key}
                data-pg={p.postgraduate ? "" : undefined}
                data-on={order === 0 ? "" : undefined}
                style={plateStyle(p, order)}
              >
                <div className={s.plateArt}>
                  <svg viewBox={drawing.viewBox} preserveAspectRatio="xMidYMid meet">
                    {drawing.content}
                  </svg>
                </div>
                <figcaption className={s.plateCaption}>
                  <span className={s.plateName}>{p.label}</span>
                  <span className={s.plateYear}>{p.year}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {mech && (
          <div className={`${s.layer} ${s.gearsLayer}`} data-depth="22">
            <div className={s.gearsCell} style={plateStyle(mech, mechIndex)}>
              <GearTrain className={s.gears} />
              <div className={s.plateCaption} data-gear-caption="">
                <span className={s.plateName}>{mech.label}</span>
                <span className={s.plateYear}>{mech.year}</span>
              </div>
            </div>
          </div>
        )}

        <div className={s.frame}>
          {KNOTS.map((pos) => (
            <EndlessKnot key={pos} className={s.knot} data-pos={pos} />
          ))}
        </div>

        <div className={s.cue}>
          <span>Scroll</span>
          <i />
          <svg viewBox="0 0 20 12">
            <path d="M2 3 L10 10 L18 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
