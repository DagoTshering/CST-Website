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

import { moveHand, STEP_MS, stations, TOUR_START_MS, type HandPosition } from "./clock";
import { useReducedMotion } from "./useReducedMotion";

export type Tour = HandPosition & {
  /** True when the visitor has paused the tour (or prefers reduced motion and has not pressed Play). */
  paused: boolean;
  /** Moves the hand to a programme and stops the tour until Play is pressed. */
  pick: (index: number) => void;
  toggle: () => void;
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
 * The clock that steps the hand from programme to programme. It runs only once the entrance
 * is over, while the hero is on screen and the tab is visible, and never after the visitor
 * pauses it or picks a programme. With reduced motion it starts paused.
 */
export function useTour(root: RefObject<HTMLElement | null>): Tour {
  const reducedMotion = useReducedMotion();
  const [hand, setHand] = useState<HandPosition>({ active: 0, laps: 0 });
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const paused = userPaused ?? reducedMotion;

  useEffect(() => {
    if (!root.current) return;
    const id = window.setTimeout(
      () => setReady(true),
      Math.max(0, TOUR_START_MS - sinceEntrance(root.current)),
    );
    return () => window.clearTimeout(id);
  }, [root]);

  useEffect(() => {
    const el = root.current;
    if (!ready || paused || !el) return;

    let timer = 0;
    let onScreen = false;
    const step = () => setHand((h) => moveHand(h, (h.active + 1) % stations.length, "forward"));
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
  }, [root, ready, paused]);

  const pick = useCallback((index: number) => {
    setUserPaused(true);
    setHand((h) => moveHand(h, index, "nearest"));
  }, []);

  const toggle = useCallback(() => setUserPaused(!paused), [paused]);

  return useMemo(() => ({ ...hand, paused, pick, toggle }), [hand, paused, pick, toggle]);
}
