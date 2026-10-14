"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { mountHeroEngine, type TourStop } from "./engine";
import { useReducedMotion } from "./useReducedMotion";

type HeroAnimatorProps = ComponentPropsWithoutRef<"section"> & { stops: TourStop[] };

/**
 * The hero section element. Its children (the drawing sheet and the copy) are rendered on the
 * server; this only adds the animation on top, and only when motion is welcome. If the
 * visitor switches reduced motion on, the engine is torn down and the static sheet remains.
 */
export function HeroAnimator({ stops, children, ...props }: HeroAnimatorProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    return mountHeroEngine(ref.current, stops);
  }, [reducedMotion, stops]);

  return (
    <section ref={ref} {...props}>
      {children}
    </section>
  );
}
