"use client";

import { useEffect, useRef } from "react";

const DURATION = 1100;

/**
 * A number that counts up from 0 the first time it scrolls into view (easing out). It is
 * rendered as the final number, so without JavaScript, with reduced motion, or when it is already
 * on screen as the page loads, it simply shows that. The counting is hidden from screen readers,
 * which read the number once.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    let frame = 0;
    el.textContent = "0";
    const run = () => {
      let start: number | null = null;
      const step = (now: number) => {
        start ??= now;
        const p = Math.min((now - start) / DURATION, 1);
        el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
