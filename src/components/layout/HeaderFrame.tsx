"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

const SCROLLED_AFTER = 8; // px

/**
 * The header element. Adds [data-scrolled] once the page has scrolled, so CSS can slide the
 * utility bar away, shrink the main row and bring in the shadow. The header's contents are
 * rendered on the server; this only watches the scroll position.
 */
export function HeaderFrame({ children, ...props }: ComponentPropsWithoutRef<"header">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-scrolled", window.scrollY > SCROLLED_AFTER);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header ref={ref} {...props}>
      {children}
    </header>
  );
}
