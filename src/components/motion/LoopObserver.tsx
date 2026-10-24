"use client";

import { useEffect } from "react";

/**
 * Pauses the endless CSS animations of a [data-loop] element (a turning emblem, a drifting
 * banner, a ticker) while it is off screen, by setting [data-offscreen]; globals.css does the
 * pausing. Off screen they show nothing, yet the browser would still work on them every frame.
 * They pick up where they stopped a little before they come back into view, so nobody sees the
 * pause. Renders nothing.
 *
 * Like data-reveal, this can run before React has hydrated an element, so every [data-loop]
 * element also needs suppressHydrationWarning.
 */
export function LoopObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries)
          target.toggleAttribute("data-offscreen", !isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );

    const watched = new WeakSet<Element>();
    const watch = () => {
      for (const el of document.querySelectorAll("[data-loop]")) {
        if (watched.has(el)) continue;
        watched.add(el);
        observer.observe(el);
      }
    };
    watch();

    // sections that read the database stream in later, and client navigation adds pages
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
    };
  }, []);

  return null;
}
