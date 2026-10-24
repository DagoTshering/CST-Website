"use client";

import { useEffect, useRef } from "react";

/** Grid spacing (px): minor and major lines, and how finely each line is drawn as it bends. */
const MINOR = 24;
const MAJOR = 120;
const STEP = 6;
/** The bend round the pointer: reach, outward push, ripple, ripple wavelength (px). */
const RADIUS = 135;
const PUSH = 9;
const RIPPLE = 1.1;
const WAVE = 18;
const REACH = RADIUS * 3;
/** Per frame: how fast the bend follows the pointer, and how fast it eases in and out. */
const FOLLOW = 0.22;
const EASE = 0.06;

/**
 * A faint blueprint grid on a canvas behind the executives chart (its parent, which it fills
 * without affecting layout). While the pointer is over the chart the grid bends a little round
 * it, like fabric: a small outward bulge with a faint ripple and wobble, easing in and back out.
 * The loop runs only while the bend is moving and stops when it has settled. With reduced motion
 * the grid is drawn once, flat. Colours come from the parent's --grid-minor and --grid-major.
 * Decorative: hidden from assistive technology and from the pointer.
 */
export function BlueprintGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sheet = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !sheet || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let colours = { minor: "", major: "" };
    // the bend's centre (eased towards the pointer) and the pointer, in sheet pixels
    let mx = -999;
    let my = -999;
    let tx = -999;
    let ty = -999;
    let amp = 0;
    let target = 0;
    let frame = 0;
    const start = performance.now();

    const warp = (x: number, y: number, t: number): [number, number] => {
      const dx = x - mx;
      const dy = y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 > REACH * REACH || amp < 0.001) return [x, y];
      const d = Math.sqrt(d2) || 1;
      const f = Math.exp(-d2 / (2 * RADIUS * RADIUS)) * amp;
      const [ux, uy] = [dx / d, dy / d];
      const out = PUSH * f + Math.sin(d / WAVE - t * 2.2) * RIPPLE * f; // bulge and ripple
      const side = Math.sin(d / (WAVE * 1.7) + t * 1.6) * 0.7 * f; // a slight wobble
      return [x + ux * out - uy * side, y + uy * out + ux * side];
    };

    // Beyond REACH of the bend (and while there is no bend) warp leaves a point where it is, so
    // a line is straight there and only its ends are drawn; it is followed point by point only
    // where it passes near the pointer.
    const line = (vertical: boolean, p: number, t: number) => {
      const length = vertical ? height : width;
      const at = (s: number) => {
        const along = Math.min(s, length);
        return vertical ? warp(p, along, t) : warp(along, p, t);
      };
      ctx.beginPath();
      ctx.moveTo(...at(0));
      let reached = 0;
      if (amp >= 0.001 && Math.abs(p - (vertical ? mx : my)) <= REACH) {
        const centre = vertical ? my : mx;
        const from = Math.max(STEP, Math.floor((centre - REACH) / STEP) * STEP);
        const to = Math.min(length, Math.ceil((centre + REACH) / STEP) * STEP);
        for (let s = from; s <= to; s += STEP) ctx.lineTo(...at((reached = s)));
      }
      if (reached < length) ctx.lineTo(...at(length));
      ctx.stroke();
    };

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = colours.minor;
      for (let x = 0; x <= width; x += MINOR) if (x % MAJOR) line(true, x + 0.5, t);
      for (let y = 0; y <= height; y += MINOR) if (y % MAJOR) line(false, y + 0.5, t);
      ctx.strokeStyle = colours.major;
      for (let x = 0; x <= width; x += MAJOR) line(true, x + 0.5, t);
      for (let y = 0; y <= height; y += MAJOR) line(false, y + 0.5, t);
    };

    const size = () => {
      const box = sheet.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const style = getComputedStyle(sheet);
      colours = {
        minor: style.getPropertyValue("--grid-minor").trim(),
        major: style.getPropertyValue("--grid-major").trim(),
      };
      draw();
    };

    const tick = () => {
      mx += (tx - mx) * FOLLOW;
      my += (ty - my) * FOLLOW;
      amp += (target - amp) * EASE;
      draw();
      if (target || amp > 0.004) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        amp = 0;
        draw(); // settled: flat again, and the loop stops
      }
    };
    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const box = sheet.getBoundingClientRect();
      tx = event.clientX - box.left;
      ty = event.clientY - box.top;
      if (target === 0) {
        mx = tx;
        my = ty;
      }
      target = 1;
      run();
    };
    const onLeave = () => {
      target = 0;
      run();
    };
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(size);
    };

    size();
    document.fonts?.ready.then(size); // the headings' web font can change the chart's height
    window.addEventListener("resize", onResize);
    if (!still) {
      sheet.addEventListener("pointermove", onMove);
      sheet.addEventListener("pointerdown", onMove);
      sheet.addEventListener("pointerleave", onLeave);
      sheet.addEventListener("pointercancel", onLeave);
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", onResize);
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerdown", onMove);
      sheet.removeEventListener("pointerleave", onLeave);
      sheet.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
