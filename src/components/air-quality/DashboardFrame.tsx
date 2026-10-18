"use client";

import { useEffect, useState } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import { airQuality } from "@/content/air-quality";

import s from "./AirQuality.module.css";

/** How long (ms) the dashboard may take before the frame offers to open it in a new tab instead. */
const SLOW_AFTER = 8000;

/**
 * The live dashboard in a frame, loaded only when the visitor asks for it: AirGradient's page
 * also loads third-party scripts (a Pipedrive sales chat, Zendesk), which see the visitor's
 * address and browser, so nothing of theirs loads until then.
 *
 * After "Show live data", a thin progress line and "Loading live data…" show until the dashboard
 * has loaded. If it takes more than eight seconds the line gives way to a sentence and a link to
 * open the dashboard in a new tab; the dashboard still shows if it arrives later.
 */
export function DashboardFrame() {
  const [state, setState] = useState<"idle" | "loading" | "slow" | "ready">("idle");

  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setTimeout(
      () => setState((current) => (current === "loading" ? "slow" : current)),
      SLOW_AFTER,
    );
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <div className={s.frame} data-state={state}>
      {state !== "idle" && (
        <iframe
          className={s.iframe}
          src={airQuality.dashboardUrl}
          title={airQuality.frameTitle}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => setState("ready")}
        />
      )}
      <div className={s.loading} role="status">
        {state === "idle" ? (
          <>
            <button type="button" className={s.show} onClick={() => setState("loading")}>
              Show live data
            </button>
            <p className={s.note}>
              This loads AirGradient’s dashboard. AirGradient, and the chat and support services its
              page uses, will see your IP address and browser.
            </p>
          </>
        ) : state === "slow" ? (
          <p className={s.help}>
            The dashboard is taking a while to load.{" "}
            {/* SmartLink opens other sites in a new tab, rel="noopener noreferrer" */}
            <SmartLink href={airQuality.dashboardUrl} className={s.link}>
              Open it in a new tab
            </SmartLink>
            .
          </p>
        ) : (
          state === "loading" && (
            <>
              <span className={s.track} aria-hidden="true">
                <i />
              </span>
              <span className={s.wait}>Loading live data…</span>
            </>
          )
        )}
      </div>
    </div>
  );
}
