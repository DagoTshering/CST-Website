import s from "./hero.module.css";

/** The hand's ornate tip, on a 130×24 grid with the ring's centre at (10, 12). */
export function TipOrnament({
  gradientId,
  ringWidth = 2.6,
}: {
  gradientId: string;
  ringWidth?: number;
}) {
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0" className={s.brassDeep} />
          <stop offset="0.5" className={s.brassLight} />
          <stop offset="1" className={s.brass} />
        </linearGradient>
      </defs>
      <circle
        cx={10}
        cy={12}
        r={5.2}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={ringWidth}
      />
      <g fill={`url(#${gradientId})`}>
        <path d="M15 10.4C50 9.2 92 10.4 129 12C92 13.6 50 14.8 15 13.6Z" />
        <path d="M84 10.6L96 3L98 11Z" />
        <path d="M84 13.4L96 21L98 13Z" />
      </g>
    </>
  );
}

/**
 * The clock hand, in two layers that turn together about the centre of the sheet: the thin
 * shaft and hub sit under the copy's fog, the ornate tip above it, so the middle stays
 * clear and the hand emerges from the fog towards the programme. Length and angle come from
 * the stylesheet (see .hand), from the variables HeroFrame sets for the active station.
 */
export function ClockHand({ part }: { part: "shaft" | "tip" }) {
  if (part === "shaft") {
    return (
      <div className={s.hand}>
        <i className={s.shaft} />
        <i className={s.hub} />
      </div>
    );
  }
  return (
    <div className={`${s.hand} ${s.handTip}`}>
      <svg className={s.tip} viewBox="0 0 130 24">
        <TipOrnament gradientId="hero-hand-brass" />
      </svg>
    </div>
  );
}
