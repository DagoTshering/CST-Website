"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";

import { TourContext, useTour } from "./useTour";

/**
 * The hero section element and the tour's state. Its children are rendered on the server;
 * this hands them the tour through context.
 */
export function HeroFrame({ children, ...props }: ComponentPropsWithoutRef<"section">) {
  const ref = useRef<HTMLElement>(null);
  const tour = useTour(ref);

  return (
    <TourContext value={tour}>
      <section ref={ref} {...props}>
        {children}
      </section>
    </TourContext>
  );
}
