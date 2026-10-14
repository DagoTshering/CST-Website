import type { ProgrammeKey } from "@/content/home";

import { GEAR_TRAIN, gearRotations } from "@/components/drawings/geometry";
import { startFrameLoop } from "./loop";
import { drawField, hexToRgb, resizeField, stepField, type ControlPoint } from "./network";
import { createTour } from "./tour";

export type TourStop = { key: ProgrammeKey; title: string; year: number };

const STEP_MS = 3400; // one beat of the tour, at every screen size
const IDLE_MS = 4200; // a still pointer hands over to the tour after this long
const HOT_RADIUS = 130; // how close the pointer must be to light a drawing
const GEAR_REST = 0.92;
const SOLO_QUERY = "(max-width: 1239px)";

type Probe = { key: ProgrammeKey; x: number; y: number; half: number };

const setFlag = (el: Element | null | undefined, name: string, on: boolean) => {
  if (!el) return;
  if (on) el.setAttribute(name, "");
  else el.removeAttribute(name);
};

/**
 * Brings the server-rendered drawing sheet to life: the survey network, the gear train, the
 * parallax layers, the programme tour and highlight, the crosshair and the scroll reveal.
 * Everything is found through data attributes inside `root`. Returns a cleanup function that
 * stops all work and puts the sheet back as the server rendered it.
 */
export function mountHeroEngine(root: HTMLElement, stops: TourStop[]) {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const soloQuery = window.matchMedia(SOLO_QUERY);
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4 || connection?.saveData === true;

  const q = <T extends Element>(selector: string) => root.querySelector<T>(selector);
  const canvas = q<HTMLCanvasElement>("canvas[data-net]");
  const ctx = canvas?.getContext("2d");
  const gearsSvg = q<SVGSVGElement>("[data-gears]");
  const gearNodes = [...root.querySelectorAll<SVGGElement>("[data-gear]")];
  const gearCaption = q<HTMLElement>("[data-gear-caption]");
  const crossH = q<HTMLElement>("[data-cross-h]");
  const crossV = q<HTMLElement>("[data-cross-v]");
  const crossTag = q<HTMLElement>("[data-cross-tag]");
  const markLabel = q<HTMLElement>("[data-mark-label]");
  const layers = [...root.querySelectorAll<HTMLElement | SVGElement>("[data-depth]")].map((el) => ({
    el,
    depth: Number(el.dataset.depth) || 0,
  }));
  const plates = new Map<ProgrammeKey, HTMLElement>();
  root.querySelectorAll<HTMLElement>("figure[data-prog]").forEach((el) => {
    plates.set(el.dataset.prog as ProgrammeKey, el);
  });
  const marks = [...root.querySelectorAll<HTMLElement>("[data-mark]")];
  if (!canvas || !ctx || !gearsSvg) return () => {};

  // Colours are read once, not every frame.
  const styles = getComputedStyle(root);
  const ink = hexToRgb(styles.getPropertyValue("--color-sheet-net"), "20,107,132");
  const gold = hexToRgb(styles.getPropertyValue("--color-sheet-gold"), "182,130,53");

  const tourKeys = stops.filter((s) => s.key === "mech" || plates.has(s.key)).map((s) => s.key);
  const tour = createTour(tourKeys, STEP_MS);
  const byKey = new Map(stops.map((s) => [s.key, s]));

  /* ---- state ---- */
  let width = 0;
  let height = 0;
  let link = 136;
  const points: ControlPoint[] = [];
  let probes: Probe[] = [];
  let gearCentres: { x: number; y: number }[] = [];
  let solo = soloQuery.matches;

  let pointerX = -1e4; // smoothed pointer, relative to the hero
  let pointerY = -1e4;
  let targetX = -1e4;
  let targetY = -1e4;
  let pointerOn = false;
  let parallaxX = 0; // -1..1, smoothed
  let parallaxY = 0;
  let targetPX = 0;
  let targetPY = 0;
  let idleSince = -1e9;
  let forced: ProgrammeKey | null = null; // set by hovering or tapping a mark
  let hotKey: ProgrammeKey | null = null;
  let speed = 1;
  let targetSpeed = 1;
  let glow = 0;
  let targetGlow = 0;
  let driver = 0;
  let frames = 0;
  const angles: number[] = [];

  /* ---- measuring (only on resize, never per frame) ---- */
  const measure = () => {
    const box = root.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    link = Math.max(100, Math.min(180, Math.round(width * 0.125)));
    const density = lowPower || width < 768 ? 0.45 : 0.75; // a calm field, never a swarm
    resizeField(
      points,
      Math.round(Math.min(84, (width * height) / 18000) * density),
      width,
      height,
    );
    measureProbes(box);
  };

  const measureProbes = (box = root.getBoundingClientRect()) => {
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, r };
    };
    probes = [];
    for (const [key, el] of plates) {
      if (solo && !el.hasAttribute("data-on")) continue;
      const { x, y, r } = rel(el);
      if (r.width) probes.push({ key, x, y, half: Math.min(r.width, r.height) / 2 });
    }
    const g = rel(gearsSvg);
    probes.push({ key: "mech", x: g.x, y: g.y, half: Math.min(g.r.width, g.r.height) / 2 });
    const vb = gearsSvg.viewBox.baseVal;
    const scale = g.r.width / vb.width;
    gearCentres = GEAR_TRAIN.gears.map((gear) => ({
      x: g.r.left - box.left + (gear.cx - vb.x) * scale,
      y: g.r.top - box.top + (gear.cy - vb.y) * scale,
    }));
  };

  /* ---- which drawing is in the shared slot, and which is lit ---- */
  const showInSlot = (key: ProgrammeKey) => {
    if (!plates.has(key)) return; // Mechanical lights the gears and leaves the slot as it is
    for (const [k, el] of plates) setFlag(el, "data-on", k === key);
    measureProbes();
  };

  const syncSolo = () => {
    solo = soloQuery.matches;
    if (solo) showInSlot(tour.key === "mech" ? tourKeys[0] : tour.key);
    else measureProbes();
  };

  const jumpTo = (key: ProgrammeKey) => {
    tour.jumpTo(key);
    if (solo) showInSlot(key);
  };

  const updateHot = (touring: boolean) => {
    let key = forced;
    if (!key && pointerOn) {
      let best = Infinity;
      for (const p of probes) {
        const d = Math.hypot(p.x - pointerX, p.y - pointerY) - p.half;
        if (d < best) {
          best = d;
          key = p.key;
        }
      }
      if (best > HOT_RADIUS) key = null;
    }
    if (!key && touring) key = tour.key;
    if (key === hotKey) return;
    hotKey = key;
    for (const [k, el] of plates) setFlag(el, "data-active", k === key);
    setFlag(gearsSvg, "data-active", key === "mech");
    setFlag(gearCaption, "data-active", key === "mech");
    // the legend strip follows the highlight, so the two always name the same programme
    for (const m of marks) setFlag(m, "data-active", m.dataset.mark === key);
  };

  const nearestGear = () => {
    if (!pointerOn) return Infinity;
    let best = Infinity;
    for (const c of gearCentres) best = Math.min(best, Math.hypot(c.x - pointerX, c.y - pointerY));
    return best;
  };

  /* ---- the frame ---- */
  const frame = (now: number, dt: number) => {
    pointerX += (targetX - pointerX) * 0.18;
    pointerY += (targetY - pointerY) * 0.18;
    parallaxX += (targetPX - parallaxX) * 0.06;
    parallaxY += (targetPY - parallaxY) * 0.06;

    const touring =
      tourKeys.length > 1 && (!fine || solo || now - idleSince > IDLE_MS) && forced === null;
    if (touring) {
      if (tour.tick(now) && solo) showInSlot(tour.key);
    } else if (!solo) {
      tour.hold();
    }

    if (frames % 6 === 0) {
      updateHot(touring);
      const d = nearestGear();
      targetSpeed = hotKey === "mech" ? 6 : 1 + 5 * Math.exp(-(d * d) / (2 * 300 * 300));
      targetGlow = hotKey === "mech" ? 1 : Math.exp(-(d * d) / (2 * 340 * 340));
      setFlag(gearsSvg, "data-fast", targetSpeed > 2.2);
    }
    speed += (targetSpeed - speed) * 0.05;
    glow += (targetGlow - glow) * 0.05;
    driver += (dt / 1000) * 7 * speed;

    if (fine) {
      for (const { el, depth } of layers) {
        el.style.transform = `translate3d(${(-parallaxX * depth).toFixed(2)}px,${(-parallaxY * depth * 0.6).toFixed(2)}px,0)`;
      }
    }

    gearRotations(GEAR_TRAIN.gears, driver, angles);
    gearNodes.forEach((node, i) =>
      node.setAttribute("transform", `rotate(${angles[i].toFixed(3)})`),
    );
    gearsSvg.style.opacity = (GEAR_REST + (1 - GEAR_REST) * glow).toFixed(3);

    stepField(points, dt, glow, width, height, pointerX, pointerY);
    drawField(ctx, points, {
      w: width,
      h: height,
      link,
      ink,
      gold,
      pointer: pointerOn ? { x: pointerX, y: pointerY } : null,
    });

    if (pointerOn && crossH && crossV && crossTag) {
      crossH.style.transform = `translateY(${pointerY.toFixed(1)}px)`;
      crossV.style.transform = `translateX(${pointerX.toFixed(1)}px)`;
      crossTag.style.transform = `translate(${(pointerX + 13).toFixed(1)}px,${(pointerY + 10).toFixed(1)}px)`;
      if (frames % 5 === 0) {
        // millimetres at 96 dpi, as an easting and northing
        crossTag.textContent = `E ${(pointerX * 0.2646).toFixed(1)}   N ${(pointerY * 0.2646).toFixed(1)}`;
      }
    }
    frames++;
  };

  /* ---- input ---- */
  const onPointerMove = (event: PointerEvent) => {
    const box = root.getBoundingClientRect();
    targetX = event.clientX - box.left;
    targetY = event.clientY - box.top;
    targetPX = (targetX / box.width - 0.5) * 2;
    targetPY = (targetY / box.height - 0.5) * 2;
    idleSince = performance.now();
    if (!pointerOn) {
      // snap on the first move, so hover answers at once instead of easing in from nowhere
      pointerX = targetX;
      pointerY = targetY;
      pointerOn = true;
    }
    // the crosshair belongs to the margins, never across the copy
    const overCopy = (event.target as Element | null)?.closest?.("[data-hero-copy]");
    setFlag(root, "data-live", !overCopy);
  };

  const onPointerLeave = () => {
    targetPX = 0;
    targetPY = 0;
    pointerOn = false;
    forced = null;
    setFlag(root, "data-live", false);
  };

  const showLabel = (key: ProgrammeKey | null) => {
    if (!markLabel) return;
    const stop = key && byKey.get(key);
    if (stop) markLabel.textContent = `${stop.title}  ·  ${stop.year}`;
    setFlag(markLabel, "data-on", Boolean(stop));
  };

  const markFrom = (event: Event) =>
    (event.target as Element | null)?.closest?.<HTMLElement>("[data-mark]") ?? null;

  const onMarkOver = (event: PointerEvent) => {
    const mark = markFrom(event);
    if (!mark || event.pointerType !== "mouse") return;
    forced = mark.dataset.mark as ProgrammeKey;
    jumpTo(forced);
    showLabel(forced);
  };

  const onMarkOut = (event: PointerEvent) => {
    const mark = markFrom(event);
    if (!mark || mark.contains(event.relatedTarget as Node | null)) return;
    if (event.pointerType !== "mouse") return;
    forced = null;
    showLabel(null);
  };

  const onMarkTap = (event: MouseEvent) => {
    if (fine) return;
    const mark = markFrom(event);
    if (!mark) return;
    const already = mark.hasAttribute("data-tapped");
    marks.forEach((m) => setFlag(m, "data-tapped", false));
    if (already) {
      forced = null;
      showLabel(null);
      return;
    }
    setFlag(mark, "data-tapped", true);
    forced = mark.dataset.mark as ProgrammeKey;
    jumpTo(forced);
    showLabel(forced);
  };

  /* ---- the underlay opens up as the hero scrolls away ---- */
  let revealFrame = 0;
  const reveal = () => {
    revealFrame = 0;
    const box = root.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height * 0.72)));
    root.style.setProperty("--reveal", progress.toFixed(3));
  };
  const onScroll = () => {
    if (!revealFrame) revealFrame = requestAnimationFrame(reveal);
  };

  /* ---- wire up ---- */
  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(root);
  document.fonts?.ready.then(() => measureProbes());
  soloQuery.addEventListener("change", syncSolo);
  window.addEventListener("scroll", onScroll, { passive: true });
  root.addEventListener("pointerover", onMarkOver);
  root.addEventListener("pointerout", onMarkOut);
  root.addEventListener("click", onMarkTap);
  if (fine) {
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);
  }
  measure();
  reveal();
  const stopLoop = startFrameLoop(root, frame);

  return () => {
    stopLoop();
    cancelAnimationFrame(revealFrame);
    resizeObserver.disconnect();
    soloQuery.removeEventListener("change", syncSolo);
    window.removeEventListener("scroll", onScroll);
    root.removeEventListener("pointerover", onMarkOver);
    root.removeEventListener("pointerout", onMarkOut);
    root.removeEventListener("click", onMarkTap);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);

    // back to the sheet exactly as the server rendered it
    ctx.clearRect(0, 0, width, height);
    root.style.removeProperty("--reveal");
    setFlag(root, "data-live", false);
    for (const { el } of layers) el.style.transform = "";
    gearsSvg.style.opacity = "";
    setFlag(gearsSvg, "data-active", false);
    setFlag(gearsSvg, "data-fast", false);
    setFlag(gearCaption, "data-active", false);
    gearRotations(GEAR_TRAIN.gears, 0, angles);
    gearNodes.forEach((node, i) =>
      node.setAttribute("transform", `rotate(${angles[i].toFixed(3)})`),
    );
    [...plates.values()].forEach((el, i) => {
      setFlag(el, "data-active", false);
      setFlag(el, "data-on", i === 0);
    });
    marks.forEach((m) => {
      setFlag(m, "data-tapped", false);
      setFlag(m, "data-active", false);
    });
    showLabel(null);
  };
}
