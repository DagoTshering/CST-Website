import type { CSSProperties } from "react";

import { formatDate } from "@/lib/dates";

import s from "./NoticeBoard.module.css";

/** The mast drawing's viewBox, shared by all its layers so they line up. */
const VIEW_BOX = "0 0 200 210";

/** A lattice mast with its aviation light, sending out signal rings (decoration). */
function Mast() {
  // the mast's two legs, from the top (100, 52) to the ground
  const legs = "M100 52 L64 196 M100 52 L136 196";
  // the cross-bracing between the legs, top to bottom
  const braces = [70, 92, 116, 142, 170].map((y) => {
    const half = ((y - 52) / 144) * 36;
    return `M${100 - half} ${y} L${100 + half} ${y}`;
  });
  const zigzag = [
    [70, 92],
    [92, 116],
    [116, 142],
    [142, 170],
    [170, 196],
  ].map(([a, b], i) => {
    const ha = ((a - 52) / 144) * 36;
    const hb = ((b - 52) / 144) * 36;
    return i % 2 ? `M${100 + ha} ${a} L${100 - hb} ${b}` : `M${100 - ha} ${a} L${100 + hb} ${b}`;
  });
  // Each ring and the light is an svg of its own, stacked over the mast with the same viewBox:
  // the browser can scale and fade a whole layer on the GPU, while a shape animated inside an
  // svg has the whole drawing laid out and repainted on every frame.
  return (
    <div className={s.mast} aria-hidden="true">
      {[0, 1, 2].map((ring) => (
        <svg key={ring} className={s.ring} viewBox={VIEW_BOX} focusable="false">
          <circle cx="100" cy="40" r="60" />
        </svg>
      ))}
      <svg viewBox={VIEW_BOX} focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d={legs} strokeWidth="2.2" />
          {braces.map((d) => (
            <path key={d} d={d} />
          ))}
          {zigzag.map((d) => (
            <path key={d} d={d} strokeOpacity="0.6" />
          ))}
          <path d="M100 52 L100 26" strokeWidth="2" />
          <path d="M56 198 L144 198" strokeOpacity="0.5" />
          <path d="M84 110 l-9 -5 M116 110 l9 -5" strokeOpacity="0.8" />
        </g>
      </svg>
      <svg className={s.beacon} viewBox={VIEW_BOX} focusable="false">
        <circle cx="100" cy="24" r="3.4" />
      </svg>
    </div>
  );
}

/**
 * The top of the Announcements page: a dark drafting sheet with the title, a few figures and a
 * broadcast mast; under it, a campus LED ticker running the latest notices (decoration: the
 * same notices are on the board below, so the ticker is hidden from screen readers).
 */
export function BroadcastHero({
  all,
  latest,
}: {
  all: number;
  latest: { title: string; publishedOn: string }[];
}) {
  const ticker = latest.map((n) => `${formatDate(n.publishedOn)}  ${n.title}`);
  return (
    <header className={s.hero} data-loop="" suppressHydrationWarning>
      <div className={`container-page ${s.heroGrid}`}>
        <div>
          <p className={s.eyebrow}>
            <span className={s.live} aria-hidden="true" />
            Notice board · College of Science and Technology
          </p>
          <h1 className={`heading-serif ${s.title}`}>Announcements</h1>
          <p className={s.intro}>
            Notices from the college: examinations, admissions, events, offices and everything else
            students, staff and visitors need to know. Job recruitment notices are under Vacancies.
          </p>
          {all > 0 && (
            <dl className={s.stats}>
              <div className={s.stat}>
                <dt>Notices</dt>
                <dd>{all}</dd>
              </div>
              {latest[0] && (
                <div className={s.stat}>
                  <dt>Latest</dt>
                  <dd>{formatDate(latest[0].publishedOn)}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <Mast />
      </div>

      {ticker.length > 0 && (
        <div
          className={s.ticker}
          aria-hidden="true"
          // a longer ticker runs longer, so it reads at the same pace
          style={
            { "--ticker-duration": `${Math.max(24, ticker.join("").length / 6)}s` } as CSSProperties
          }
        >
          <span className={s.tickerLabel}>Latest</span>
          <div className={s.tickerTrack}>
            {/* twice, so the loop is seamless */}
            {[0, 1].map((copy) => (
              <div key={copy} className={s.tickerItems}>
                {ticker.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
