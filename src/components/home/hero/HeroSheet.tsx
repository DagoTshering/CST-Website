import Image from "next/image";

import type { Programme } from "@/content/home";

import { DRAWINGS } from "./drawings";
import { GearTrain } from "./GearTrain";
import { KNOT_PATH } from "./geometry";
import s from "./hero.module.css";
import { programmeColours } from "./palette";

const KNOTS = ["tl", "tr", "bl", "br"] as const;

/**
 * The hero's background: an engineering drawing sheet over a faint aerial photograph, with a
 * drawing for every programme. Everything here is rendered on the server and is complete
 * without JavaScript; engine.ts animates it once the page is interactive. The sheet is
 * decorative, so it is hidden from assistive technology (the legend strip names the
 * programmes instead).
 *
 * Below 1240px the drawings share one slot and take turns in it; the server shows the first.
 */
export function HeroSheet({ programmes }: { programmes: Programme[] }) {
  const plates = programmes.filter((p) => p.key !== "mech");
  const mech = programmes.find((p) => p.key === "mech");

  return (
    <div className={s.sheet} aria-hidden="true" data-sheet="">
      <div className={`${s.layer} ${s.photo}`} data-depth="0">
        <Image
          src="/images/home/campus-aerial-view.jpg"
          alt=""
          fill
          preload
          sizes="100vw"
          className={s.photoImage}
        />
      </div>
      <div className={`${s.layer} ${s.grid}`} data-depth="4" />
      <canvas className={`${s.layer} ${s.net}`} data-depth="9" data-net="" />
      <div className={s.scrim} />

      <GearTrain className={`${s.layer} ${s.gears}`} />
      {mech && (
        <div className={s.gearCaption} data-gear-caption="" style={programmeColours("mech")}>
          <span className={s.plateName}>{mech.label}</span>
          <span className={s.plateYear}>{mech.year}</span>
        </div>
      )}

      <div className={`${s.layer} ${s.plates}`} data-depth="15">
        {plates.map((p, i) => {
          const drawing = DRAWINGS[p.key as keyof typeof DRAWINGS];
          return (
            <figure
              key={p.key}
              className={s.plate}
              data-prog={p.key}
              data-pg={p.postgraduate ? "" : undefined}
              data-on={i === 0 ? "" : undefined}
              style={programmeColours(p.key)}
            >
              <svg viewBox={drawing.viewBox} preserveAspectRatio="xMidYMid meet">
                {drawing.content}
              </svg>
              <figcaption>
                <span className={s.plateName}>{p.label}</span>
                <span className={s.plateYear}>{p.year}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className={s.cross}>
        <i className={s.crossH} data-cross-h="" />
        <i className={s.crossV} data-cross-v="" />
        <span className={s.crossTag} data-cross-tag="" />
      </div>

      <div className={s.frame}>
        {KNOTS.map((pos) => (
          <svg key={pos} className={s.knot} data-pos={pos} viewBox="0 0 5 5">
            <path d={KNOT_PATH} />
          </svg>
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
  );
}
