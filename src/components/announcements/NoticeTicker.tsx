import type { CSSProperties } from "react";

import { formatDate } from "@/lib/dates";

import s from "./NoticeBoard.module.css";

/**
 * A thin strip under the title band running the latest notices, like a campus notice display
 * (decoration: the same notices are on the board below, so it is hidden from screen readers). It
 * pauses when pointed at, and stands still for visitors who ask for reduced motion.
 */
export function NoticeTicker({ latest }: { latest: { title: string; publishedOn: string }[] }) {
  if (latest.length === 0) return null;
  const lines = latest.map((n) => `${formatDate(n.publishedOn)}  ${n.title}`);
  return (
    <div
      className={s.ticker}
      // its endless scroll rests while off screen (LoopObserver)
      data-loop=""
      suppressHydrationWarning
      aria-hidden="true"
      // a longer ticker runs longer, so it reads at the same pace
      style={
        { "--ticker-duration": `${Math.max(24, lines.join("").length / 6)}s` } as CSSProperties
      }
    >
      <span className={s.tickerLabel}>Latest</span>
      <div className={s.tickerTrack}>
        {/* twice, so the loop is seamless */}
        {[0, 1].map((copy) => (
          <div key={copy} className={s.tickerItems}>
            {lines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
