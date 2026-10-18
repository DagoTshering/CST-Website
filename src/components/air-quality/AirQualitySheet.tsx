import { SmartLink } from "@/components/ui/SmartLink";
import { airQuality } from "@/content/air-quality";

import s from "./AirQuality.module.css";
import { DashboardFrame } from "./DashboardFrame";

/**
 * The live dashboard set on a drawing sheet, in the line work of the Executives and Staff
 * Directory pages: a faint grid fading into the white, corner marks, a monospace figure caption
 * with a link to the full dashboard, the dashboard's frame (a teal hairline with square markers
 * at two corners), and a small title block naming the source. Under the sheet, a way out if the
 * dashboard does not show. Links to the dashboard open in a new tab (SmartLink).
 */
export function AirQualitySheet() {
  return (
    <>
      <section className={s.sheet} aria-labelledby="air-quality-caption">
        <i className={`${s.reg} ${s.tl}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.tr}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.bl}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.br}`} aria-hidden="true" />

        <div className={s.caption}>
          <h2 id="air-quality-caption" className={s.figure}>
            <b>Fig. 01</b> · Campus monitor, live readings
          </h2>
          <SmartLink href={airQuality.dashboardUrl} className={s.open}>
            Open full dashboard <span aria-hidden="true">↗</span>
          </SmartLink>
        </div>

        <DashboardFrame />

        <p className={s.titleBlock}>
          <b>Source</b>
          AirGradient sensor, CST campus
        </p>
      </section>

      <p className={s.fallback}>
        Dashboard not showing?{" "}
        <SmartLink href={airQuality.dashboardUrl} className={s.link}>
          Open it in a new tab
        </SmartLink>
        .
      </p>
    </>
  );
}
