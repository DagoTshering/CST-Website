"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";

import { HOLD_MS, STEP_MS, stations, TOUR_START_MS } from "./clock";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

export type Tour = {
  /** The active station, or -1 until the tour starts. */
  active: number;
  /** Lights a programme and holds the tour there for a while (a tap or the keyboard). */
  pick: (index: number) => void;
  /**
   * Lights the programme under the pointer (or keyboard focus) and holds the tour there until
   * it is released with null; the tour then carries on in order from that programme.
   */
  point: (index: number | null) => void;
};

export const TourContext = createContext<Tour | null>(null);

export function useTourContext() {
  const tour = use(TourContext);
  if (!tour) throw new Error("useTourContext must be used inside HeroFrame");
  return tour;
}

/**
 * How long ago the hero first painted, read from its entrance animations, so the tour starts
 * in step with the entrance even when hydration is slow.
 */
function sinceEntrance(root: HTMLElement) {
  let elapsed = -1;
  for (const animation of root.getAnimations({ subtree: true })) {
    const time = animation instanceof CSSAnimation ? animation.currentTime : null;
    if (typeof time === "number") elapsed = Math.max(elapsed, time);
  }
  return elapsed < 0 ? TOUR_START_MS : elapsed;
}

/**
 * The tour that lights the programmes one after another. It runs only once the entrance is
 * over, while the hero is on screen, the tab is visible and no programme is held: one under
 * the pointer, or one picked in the last HOLD_MS. When the hold ends it waits a full beat and
 * moves on to the next programme in order. Until the tour starts nothing is lit. With reduced
 * motion the first programme is lit at the same moment, but the tour never runs.
 */
export function useTour(root: RefObject<HTMLElement | null>): Tour {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(-1);
  const [ready, setReady] = useState(false);
  /** Counts the picks; each one restarts the hold. */
  const [picks, setPicks] = useState(0);
  const [picked, setPicked] = useState(false);
  const [pointed, setPointed] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    // once the page has settled the first programme lights up (unless one already is)
    const id = window.setTimeout(
      () => {
        setReady(true);
        setActive((a) => (a < 0 ? 0 : a));
      },
      Math.max(0, TOUR_START_MS - sinceEntrance(root.current)),
    );
    return () => window.clearTimeout(id);
  }, [root]);

  useEffect(() => {
    if (!picks) return;
    const id = window.setTimeout(() => setPicked(false), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [picks]);

  const held = picked || pointed;

  useEffect(() => {
    const el = root.current;
    if (!ready || reducedMotion || held || !el) return;

    let timer = 0;
    let onScreen = false;
    const step = () => setActive((a) => (a + 1) % stations.length);
    const sync = () => {
      const run = onScreen && !document.hidden;
      if (run && !timer) timer = window.setInterval(step, STEP_MS);
      if (!run && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [root, ready, reducedMotion, held]);

  const pick = useCallback((index: number) => {
    setPicked(true);
    setPicks((n) => n + 1);
    setActive(index);
  }, []);

  const point = useCallback((index: number | null) => {
    setPointed(index !== null);
    if (index !== null) setActive(index);
  }, []);

  return useMemo(() => ({ active, pick, point }), [active, pick, point]);
}
