"use client";

import { useEffect, useRef, useState } from "react";

import { SmartLink } from "@/components/ui/SmartLink";
import { airQuality } from "@/content/air-quality";

import s from "./AirQuality.module.css";

/** How long (ms) the dashboard may take before the frame offers to open it in a new tab instead. */
const SLOW_AFTER = 8000;

/**
 * The live dashboard in a frame, with a thin progress line and "Loading live data…" until it
 * has loaded. If it takes more than eight seconds (counted from when the frame comes on screen,
 * since it loads lazily) the line gives way to a sentence and a link to open the dashboard in a
 * new tab; the dashboard still shows if it arrives later.
 *
 * The iframe is added once the page is running, so its load event is never missed by arriving
 * before the page is interactive.
 */
export function DashboardFrame() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<"loading" | "slow" | "ready">("loading");

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setMounted(true);
        timer = window.setTimeout(
          () => setState((current) => (current === "ready" ? current : "slow")),
          SLOW_AFTER,
        );
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(frame);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={frameRef} className={s.frame} data-state={state}>
      {mounted && (
        <iframe
          className={s.iframe}
          src={airQuality.dashboardUrl}
          title={airQuality.frameTitle}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => setState("ready")}
        />
      )}
      <div className={s.loading} role="status">
        {state === "slow" ? (
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
