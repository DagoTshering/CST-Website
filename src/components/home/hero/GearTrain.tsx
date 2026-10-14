import { GEAR_MODULE, GEAR_TRAIN, gearOutline, gearRotations } from "./geometry";
import s from "./hero.module.css";

const { gears, viewBox } = GEAR_TRAIN;
const restingAngles = gearRotations(gears, 0);

/**
 * Mechanical's drawing: a meshing gear train with pitch circles and timing marks. It is drawn
 * at rest on the server; engine.ts turns each wheel (the [data-gear] groups) at its ratio.
 */
export function GearTrain({ className }: { className?: string }) {
  const driver = gears[0];
  const axes =
    `M${viewBox.x} ${driver.cy}H${viewBox.x + viewBox.width}` +
    `M${driver.cx} ${viewBox.y}V${viewBox.y + viewBox.height}`;

  return (
    <svg
      className={className}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      data-gears=""
      data-depth="22"
    >
      <path
        className={s.axis}
        d={axes}
        strokeWidth={0.8}
        strokeDasharray="16 4 2 4"
        strokeOpacity={0.45}
      />
      {gears.map((g, i) => {
        const hub = g.root * 0.34;
        const spokeCount = g.z >= 30 ? 6 : 5;
        return (
          <g key={i} transform={`translate(${g.cx} ${g.cy})`}>
            <g data-gear={i} transform={`rotate(${restingAngles[i].toFixed(3)})`}>
              <path
                d={gearOutline(g.z, GEAR_MODULE)}
                strokeWidth={g.z > 24 ? 1.5 : 1.15}
                strokeOpacity={0.6}
                strokeLinejoin="round"
              />
              <circle r={hub.toFixed(2)} strokeWidth={1.1} strokeOpacity={0.52} />
              <circle r={(g.root * 0.15).toFixed(2)} strokeWidth={0.9} strokeOpacity={0.4} />
              {g.z >= 18 && (
                <>
                  <circle r={(g.root * 0.74).toFixed(2)} strokeWidth={0.9} strokeOpacity={0.3} />
                  {Array.from({ length: spokeCount }, (_, k) => {
                    const a = (k * Math.PI * 2) / spokeCount;
                    return (
                      <line
                        key={k}
                        x1={(Math.cos(a) * hub).toFixed(2)}
                        y1={(Math.sin(a) * hub).toFixed(2)}
                        x2={(Math.cos(a) * g.root * 0.74).toFixed(2)}
                        y2={(Math.sin(a) * g.root * 0.74).toFixed(2)}
                        strokeWidth={0.9}
                        strokeOpacity={0.28}
                      />
                    );
                  })}
                </>
              )}
              {g.z >= 17 && (
                // gold timing marks, as index marks on a real train
                <>
                  <path
                    className={s.timingMark}
                    d={`M${hub.toFixed(1)} 0H${(g.root * 0.92).toFixed(1)}`}
                    strokeWidth={1.3}
                  />
                  <path
                    className={s.timingArrow}
                    d={`M${(g.pitch - 3.4).toFixed(1)} -3.4L${(g.pitch + 2.6).toFixed(1)} 0L${(g.pitch - 3.4).toFixed(1)} 3.4Z`}
                  />
                </>
              )}
            </g>
            {g.z >= 26 && (
              <>
                <circle
                  className={s.pitch}
                  r={g.pitch.toFixed(2)}
                  strokeWidth={0.85}
                  strokeDasharray="11 3 2 3"
                  strokeOpacity={0.6}
                />
                <text className={s.gearLabel} x={(g.pitch + 8).toFixed(2)} y={-5}>
                  z={g.z} m={GEAR_MODULE}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
