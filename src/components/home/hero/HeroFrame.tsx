"use client";

import { useRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { stations } from "./clock";
import { TourContext, useTour } from "./useTour";

/**
 * The hero section element and the tour's state. Its children are rendered on the server;
 * this hands them the tour through context, and tells both clock hands where to point with
 * CSS variables on the section, so the hands themselves need no JavaScript.
 */
export function HeroFrame({ children, style, ...props }: ComponentPropsWithoutRef<"section">) {
  const ref = useRef<HTMLElement>(null);
  const tour = useTour(ref);
  const station = stations[tour.active];

  const hand = {
    "--hand-cos": station.cos,
    "--hand-sin": station.sin,
    "--hand-wrap": station.wrap,
    "--hand-theta": station.theta,
    "--hand-laps": tour.laps,
  } as CSSProperties;

  return (
    <TourContext value={tour}>
      <section ref={ref} style={{ ...style, ...hand }} {...props}>
        {children}
      </section>
    </TourContext>
  );
}
