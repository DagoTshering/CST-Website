"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { startShare, stations } from "./clock";
import s from "./hero.module.css";
import { createFrameLoop } from "./loop";
import { makeOrbit, type Orbit } from "./orbit";
import { programmeColours } from "./palette";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useTourContext } from "./useTour";

/** The stations belong to the big clock; phones and tablets get the dial instead. */
const WIDE = "(min-width: 1000px)";
/** Room for the active programme's name, above or below its drawing. */
const LABEL = 20;
/** The least space between a station and the copy. */
const GAP = 16;
/** The widest the oval gets, so the stations stay near the copy on a very wide screen. */
const MAX_RX = 760;
/** The squarest the oval gets when a short screen leaves little room round the copy. */
const MAX_N = 5;
/** How fast the stations travel round the orbit, in pixels a second: slow enough to read. */
const SPEED = 12;

type Box = { top: number; bottom: number; left: number; right: number };

/** The orbit as laid out on the stage: its centre and the stage's size, in pixels. */
type Geometry = { orbit: Orbit; cx: number; cy: number; w: number; h: number };

/**
 * The box round the copy's words and buttons (not the column they sit in, which is wider),
 * relative to `origin`. Hidden parts (the phone dial and caption) have no size and are skipped.
 */
function measureCopy(copy: HTMLElement, origin: DOMRect): Box | null {
  const box = { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity };
  const add = (r: DOMRect) => {
    if (!r.width || !r.height) return;
    box.top = Math.min(box.top, r.top - origin.top);
    box.bottom = Math.max(box.bottom, r.bottom - origin.top);
    box.left = Math.min(box.left, r.left - origin.left);
    box.right = Math.max(box.right, r.right - origin.left);
  };

  const range = document.createRange();
  const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    add(range.getBoundingClientRect());
  }
  copy.querySelectorAll("a, button").forEach((el) => add(el.getBoundingClientRect()));
  return box.top === Infinity ? null : box;
}

/**
 * The orbit for the hero as it is: the largest oval that keeps every drawing and its name
 * inside the sheet's border wherever it travels. Where it would bring a station within GAP of
 * the copy, it is made squarer (a larger n) until it clears, so the stations pass above and
 * below the copy rather than over it.
 */
function measureOrbit(
  hero: HTMLElement,
  stage: HTMLElement,
  buttons: HTMLElement[],
  copy: HTMLElement | null,
): Geometry {
  const origin = stage.getBoundingClientRect();
  const w = origin.width;
  const h = origin.height;
  const cx = w / 2;
  const cy = h / 2;
  // the sheet's border (--inset in the stylesheet), and a little air inside it
  const edge = Math.min(28, Math.max(12, hero.clientWidth * 0.0175)) + 8;

  const hw = Math.max(...buttons.map((b) => b.offsetWidth / 2));
  const hh = Math.max(...buttons.map((b) => b.offsetHeight / 2));
  const rx = Math.min(MAX_RX, cx - edge - hw);
  const ry = cy - edge - hh - LABEL;

  let n = 2;
  const words = copy && measureCopy(copy, origin);
  if (words) {
    // the half-width over which a station would overlap the copy, and the height it must clear
    const reach = Math.max(cx - words.left, words.right - cx) + hw + GAP;
    const clear = Math.max(cy - words.top, words.bottom - cy) + hh + GAP;
    const height = (k: number) => ry * (1 - (reach / rx) ** k) ** (1 / k);
    if (reach < rx) while (n < MAX_N && height(n) < clear) n += 0.1;
  }
  return { orbit: makeOrbit(rx, ry, n), cx, cy, w, h };
}

/**
 * Lays the stations out on the orbit and sets them travelling slowly round it, clockwise.
 * The orbit is measured again whenever the stage or the copy changes size (a resize, the fonts
 * arriving, the copy's entrance ending); the stations keep their share of the way round.
 * They stop while `held` (a station under the pointer), off screen, in a hidden tab, and for
 * good with reduced motion. Positions are written straight to the buttons' styles, so the
 * travel never re-renders React; until the first layout, and without JavaScript, the
 * stylesheet's fallback positions stand.
 */
function useOrbit(held: { current: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const resume = useRef(() => {});
  const reducedMotion = useReducedMotion();
  const [line, setLine] = useState<{ d: string; w: number; h: number } | null>(null);

  useEffect(() => {
    const stage = ref.current;
    const hero = stage?.closest("section");
    if (!stage || !hero) return;
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const buttons = Array.from(stage.querySelectorAll<HTMLElement>("button"));
    const wide = window.matchMedia(WIDE);

    let geometry: Geometry | null = null;
    /** How far round the stations have travelled, as a share of the orbit. */
    let travelled = 0;

    const place = () => {
      if (!geometry) return;
      const { orbit, cx, cy } = geometry;
      buttons.forEach((button, i) => {
        const p = orbit.at((startShare(i) + travelled) * orbit.total);
        button.style.setProperty("--x", `${(cx + p.x).toFixed(1)}px`);
        button.style.setProperty("--y", `${(cy + p.y).toFixed(1)}px`);
        button.style.setProperty("--lean", p.ux.toFixed(3));
        button.toggleAttribute("data-above", p.uy < -0.3);
      });
    };

    const loop = reducedMotion
      ? null
      : createFrameLoop(hero, (_, dt) => {
          if (!geometry || held.current || !wide.matches) return false;
          travelled = (travelled + (SPEED * dt) / 1000 / geometry.orbit.total) % 1;
          place();
          return true;
        });
    resume.current = () => loop?.wake();

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!wide.matches) return;
        geometry = measureOrbit(hero, stage, buttons, copy);
        place();
        setLine({ d: geometry.orbit.path, w: geometry.w, h: geometry.h });
        loop?.wake();
      });
    };

    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    if (copy) resize.observe(copy);
    copy?.addEventListener("animationend", measure);
    wide.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      loop?.dispose();
      resize.disconnect();
      copy?.removeEventListener("animationend", measure);
      wide.removeEventListener("change", measure);
    };
  }, [held, reducedMotion]);

  return { ref, line, resume };
}

/**
 * The programmes on their orbit, one button each, in tour order, travelling slowly round a
 * thin gold line. The drawings are rendered on the server and passed in. Hovering a programme
 * (or reaching it with the keyboard) lights it and stops the orbit and the tour there; moving
 * off it lets both carry on, the tour in order from that programme. A tap or Enter/Space lights
 * it and holds the tour for a while.
 */
export function Stations({ drawings, label }: { drawings: ReactNode[]; label: string }) {
  const { active, pick, point } = useTourContext();
  const held = useRef(false);
  const { ref, line, resume } = useOrbit(held);

  const hold = (i: number) => {
    held.current = true;
    point(i);
  };
  const release = () => {
    held.current = false;
    point(null);
    resume.current();
  };

  return (
    <div className={s.ring} role="group" aria-label={label} data-laid={line ? "" : undefined}>
      <div ref={ref} className={s.stage}>
        {line ? (
          <svg
            className={s.orbit}
            viewBox={`${-line.w / 2} ${-line.h / 2} ${line.w} ${line.h}`}
            aria-hidden="true"
          >
            <path d={line.d} />
          </svg>
        ) : (
          <div className={`${s.orbit} ${s.orbitFallback}`} aria-hidden="true" />
        )}
        {stations.map((station, i) => (
          <button
            key={station.key}
            type="button"
            className={s.station}
            data-on={i === active ? "" : undefined}
            data-pg={station.postgraduate ? "" : undefined}
            data-above={station.above ? "" : undefined}
            aria-label={`${station.title}, since ${station.year}`}
            aria-current={i === active ? "true" : undefined}
            style={
              {
                ...programmeColours(station.key),
                "--cos": station.cos,
                "--sin": station.sin,
                "--i": i,
              } as CSSProperties
            }
            onPointerEnter={(e) => e.pointerType !== "touch" && hold(i)}
            onPointerLeave={(e) => e.pointerType !== "touch" && release()}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && hold(i)}
            onBlur={release}
            onClick={(e) => (e.nativeEvent as PointerEvent).pointerType !== "mouse" && pick(i)}
          >
            {drawings[i]}
            <span className={s.year}>{station.year}</span>
            <span className={s.name}>{station.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
