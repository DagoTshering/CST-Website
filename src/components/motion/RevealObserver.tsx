"use client";

import { useEffect } from "react";

/**
 * Reveals [data-reveal] elements the first time they enter the screen, by setting
 * [data-revealed] (globals.css does the easing). Elements already on screen when the page
 * loads are marked before anything is hidden, so nothing flashes. Renders nothing.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reveal = (el: Element) => el.setAttribute("data-revealed", "");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const watch = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not([data-revealed])")) {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) reveal(el);
        else observer.observe(el);
      }
    };
    watch();
    root.setAttribute("data-reveal-ready", "");

    return () => {
      observer.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
