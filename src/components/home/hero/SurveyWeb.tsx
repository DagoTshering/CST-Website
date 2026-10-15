"use client";

import { useEffect, useRef } from "react";

import s from "./hero.module.css";
import { createFrameLoop } from "./loop";
import { useReducedMotion } from "./useReducedMotion";
import { drawWeb, hexToRgb, scatterNodes, type WebNode, type WebPointer } from "./web";

/** The web belongs to the big clock; phones and tablets do not get it. */
const WIDE = "(min-width: 1000px)";

/**
 * Draws the survey web on a canvas once, then redraws it only while the pointer is over the
 * hero or its trace is fading out. With reduced motion the still web is drawn and nothing
 * follows the pointer.
 */
function mountWeb(canvas: HTMLCanvasElement, hero: HTMLElement, still: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  // colours are read once, not every frame
  const styles = getComputedStyle(canvas);
  const colours = {
    line: hexToRgb(styles.getPropertyValue("--color-primary"), "51,139,163"),
    trace: hexToRgb(styles.getPropertyValue("--color-primary-strong"), "43,122,144"),
    gold: hexToRgb(styles.getPropertyValue("--brass"), "184,146,58"),
  };

  const nodes: WebNode[] = [];
  const pointer: WebPointer = { x: 0, y: 0, a: 0 };
  let target: { x: number; y: number } | null = null;
  let w = 0;
  let h = 0;

  const draw = (time: number) => drawWeb(ctx, nodes, { w, h, pointer, time, colours });

  const measure = () => {
    w = Math.max(1, canvas.clientWidth);
    h = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scatterNodes(nodes, Math.round(Math.min(92, (w * h) / 12000)));
    draw(performance.now());
  };

  const frame = (now: number) => {
    if (target) {
      if (pointer.a < 0.02) {
        pointer.x = target.x;
        pointer.y = target.y;
      }
      pointer.x += (target.x - pointer.x) * 0.22;
      pointer.y += (target.y - pointer.y) * 0.22;
      pointer.a += (1 - pointer.a) * 0.1;
    } else {
      pointer.a *= 0.88;
    }
    const idle = !target && pointer.a < 0.02;
    if (idle) pointer.a = 0;
    draw(now);
    return !idle;
  };

  const resize = new ResizeObserver(measure);
  resize.observe(canvas);
  // a move to a screen with a different pixel density keeps the size but needs a new backing store
  let density: MediaQueryList;
  const onDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    density.addEventListener("change", onDensity);
    measure();
  };
  const unmeasure = () => {
    resize.disconnect();
    density.removeEventListener("change", onDensity);
  };
  onDensity();
  if (still) return unmeasure;

  const loop = createFrameLoop(hero, frame);
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const box = canvas.getBoundingClientRect();
    target = { x: event.clientX - box.left, y: event.clientY - box.top };
    loop.wake();
  };
  const onLeave = () => {
    target = null;
  };
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", onLeave);

  return () => {
    unmeasure();
    loop.dispose();
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", onLeave);
  };
}

export function SurveyWeb() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest("section");
    if (!canvas || !hero) return;

    const wide = window.matchMedia(WIDE);
    let unmount = () => {};
    const apply = () => {
      unmount();
      unmount = wide.matches ? mountWeb(canvas, hero, reducedMotion) : () => {};
    };
    apply();
    wide.addEventListener("change", apply);
    return () => {
      wide.removeEventListener("change", apply);
      unmount();
    };
  }, [reducedMotion]);

  return <canvas ref={ref} className={s.web} />;
}
