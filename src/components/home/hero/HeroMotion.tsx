"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/**
 * The hero's section element. Its contents are rendered on the server; this only pauses the
 * photo's slow zoom (a CSS animation) by setting [data-paused] while the hero is off screen or
 * the tab is hidden, so it costs nothing when nobody can see it.
 */
export function HeroMotion({ children, ...props }: ComponentPropsWithoutRef<"section">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = ref.current;
    if (!hero) return;
    let onScreen = true;
    const sync = () => hero.toggleAttribute("data-paused", !onScreen || document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <section ref={ref} {...props}>
      {children}
    </section>
  );
}
