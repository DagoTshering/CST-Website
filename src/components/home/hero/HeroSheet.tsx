import Image from "next/image";

import { ClockHand } from "./ClockHand";
import s from "./hero.module.css";
import { Frame, Ornament } from "./Ornament";
import { SurveyWeb } from "./SurveyWeb";

/**
 * The hero's background: a drawing sheet over a faint aerial photograph, with the ornament,
 * the clock hand and the fog that keeps the copy clear. It is rendered on the server and is
 * complete without JavaScript; only the survey web is drawn in the browser. All of it is
 * decorative, so it is hidden from assistive technology (the programme stations, rendered
 * separately, are the real controls).
 *
 * Layers, bottom to top: photograph, grid, ornament and frame; the hand's shaft; the fog
 * behind the copy; the survey web; the hand's tip.
 */
export function HeroSheet() {
  return (
    <div className={s.sheet} aria-hidden="true">
      <div className={s.backdrop}>
        <div className={s.photo}>
          <Image
            src="/images/home/campus-aerial-view.jpg"
            alt=""
            fill
            preload
            sizes="100vw"
            className={s.photoImage}
          />
        </div>
        <div className={s.grid} />
        <Ornament />
        <div className={s.stage}>
          <Frame />
        </div>
      </div>

      <ClockHand part="shaft" />
      <div className={s.fog} />
      <SurveyWeb />
      <ClockHand part="tip" />
    </div>
  );
}
