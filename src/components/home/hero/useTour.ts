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

import { HOLD_MS, moveHand, STEP_MS, stations, TOUR_START_MS, type HandPosition } from "./clock";
import { useReducedMotion } from "./useReducedMotion";

export type Tour = HandPosition & {
  /** Moves the hand to a programme and holds the tour there for a while. */
  pick: (index: number) => void;
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
 * is over, while the hero is on screen and the tab is visible. A programme the visitor picks
 * holds the hand for HOLD_MS before the tour moves on. Until the tour starts the hand rests just
 * before the first programme and nothing is lit. With reduced motion the first programme is lit
 * at the same moment, but the tour never runs.
 */
export function useTour(root: RefObject<HTMLElement | null>): Tour {
  const reducedMotion = useReducedMotion();
  const [hand, setHand] = useState<HandPosition>({ active: -1, laps: 0 });
  const [ready, setReady] = useState(false);
  /** Counts the visitor's picks; each one restarts the hold. */
  const [picks, setPicks] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    // once the page has settled the hand moves on to the first programme (unless one is picked)
    const id = window.setTimeout(
      () => {
        setReady(true);
        setHand((h) => (h.active < 0 ? moveHand(h, 0, "forward") : h));
      },
      Math.max(0, TOUR_START_MS - sinceEntrance(root.current)),
    );
    return () => window.clearTimeout(id);
  }, [root]);

  useEffect(() => {
    if (!picks) return;
    const id = window.setTimeout(() => setHeld(false), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [picks]);

  useEffect(() => {
    const el = root.current;
    if (!ready || reducedMotion || held || !el) return;

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
  }, [root, ready, reducedMotion, held]);

  const pick = useCallback((index: number) => {
    setHeld(true);
    setPicks((n) => n + 1);
    setHand((h) => moveHand(h, index, "nearest"));
  }, []);

  return useMemo(() => ({ ...hand, pick }), [hand, pick]);
}
