"use client";

import { useEffect } from "react";

/**
 * Reveals [data-reveal] elements the first time they enter the screen, by setting
 * [data-revealed] (globals.css does the easing). Elements already on screen when the page
 * loads are marked before anything is hidden, so nothing flashes. Renders nothing.
 *
 * This can run before React has hydrated the page's content (for example when the page is
 * reloaded scrolled down), so every [data-reveal] element also needs suppressHydrationWarning:
 * React then accepts the added data-revealed attribute instead of reporting a mismatch.
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

    const watched = new WeakSet<Element>();
    const watch = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not([data-revealed])")) {
        if (watched.has(el)) continue;
        watched.add(el);
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) reveal(el);
        else observer.observe(el);
      }
    };
    watch();
    root.setAttribute("data-reveal-ready", "");

    // Sections that read the database stream in after this has run (they sit behind Suspense),
    // so elements added later are picked up too; otherwise they would stay hidden.
    let queued = false;
    const added = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        watch();
      });
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      added.disconnect();
      observer.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
