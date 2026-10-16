"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

import { useReducedMotion } from "./useReducedMotion";

/**
 * How far the page has scrolled through a pinned section: 0 as its first child (the pinned
 * one) reaches its sticky place, 1 as it is about to scroll away.
 */
export function pinProgress(section: HTMLElement) {
  const pinned = section.firstElementChild as HTMLElement | null;
  if (!pinned) return 0;
  const box = section.getBoundingClientRect();
  const top = parseFloat(getComputedStyle(pinned).top) || 0;
  const travel = box.height - pinned.offsetHeight;
  return travel > 0 ? Math.min(1, Math.max(0, (top - box.top) / travel)) : 0;
}

/**
 * The page position (window.scrollY) at which a pinned section's progress is `p`; the
 * inverse of pinProgress, for controls that move the page to a point in the scene.
 */
export function pinScrollY(section: HTMLElement, p: number) {
  const pinned = section.firstElementChild as HTMLElement | null;
  if (!pinned) return window.scrollY;
  const top = parseFloat(getComputedStyle(pinned).top) || 0;
  const start = section.getBoundingClientRect().top + window.scrollY - top;
  return start + p * (section.offsetHeight - pinned.offsetHeight);
}

/**
 * A section whose first child stays pinned (position: sticky, in the section's own stylesheet)
 * while the page scrolls through it. It marks itself [data-pinned] once it is running and
 * sets --p, from 0 as the pinned child reaches its place to 1 as it is about to scroll away,
 * so CSS can play a transition with the scroll, forwards or backwards. It never takes over the
 * scroll itself. With reduced motion, or without JavaScript, it is an ordinary section and the
 * stylesheet's unpinned layout stands.
 */
export function ScrollPin({ children, ...props }: ComponentPropsWithoutRef<"section">) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = ref.current;
    const pinned = section?.firstElementChild as HTMLElement | null;
    if (!section || !pinned || reducedMotion) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      section.style.setProperty("--p", pinProgress(section).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    section.setAttribute("data-pinned", "");
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      section.removeAttribute("data-pinned");
      section.style.removeProperty("--p");
    };
  }, [reducedMotion]);

  return (
    <section ref={ref} {...props}>
      {children}
    </section>
  );
}
