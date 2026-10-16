/**
 * The survey web: still control points joined by faint lines, drawn on a canvas. It only
 * wakes near the pointer, where a small gold ring follows the pointer, gold sight lines run
 * to the nearest points and those points turn into small technical marks (gears, circuit
 * traces, a resistor, a signal wave).
 */

type Shape = "gear" | "circuit" | "resistor" | "wave" | "dot";
const SHAPES: Shape[] = ["gear", "circuit", "resistor", "wave", "gear", "circuit", "dot"];

export type WebNode = {
  /** Position as a share of the canvas, so a resize stretches the web rather than reshuffling it. */
  u: number;
  v: number;
  shape: Shape;
  /** Fixed per node: which way it faces and which way its gear turns. */
  phase: number;
  size: number;
};

/** The pointer, smoothed; `a` (0–1) fades the pointer's effects in and out. */
export type WebPointer = { x: number; y: number; a: number };

/** "r,g,b" strings */
export type WebColours = { line: string; trace: string; gold: string };

type DrawOptions = {
  w: number;
  h: number;
  pointer: WebPointer;
  time: number;
  colours: WebColours;
};

const LINK = 160; // points closer than this are joined
const SIGHT = 190; // sight lines from the pointer reach this far
const WAKE = 170; // points this close to the pointer turn into marks
const MAX_ALPHA = 0.55;

/** Adds or removes points so there are exactly `count`. */
export function scatterNodes(nodes: WebNode[], count: number) {
  for (let i = nodes.length; i < count; i++) {
    nodes.push({
      u: Math.random(),
      v: Math.random(),
      shape: SHAPES[i % SHAPES.length],
      phase: Math.random() * Math.PI * 2,
      size: 11 + Math.random() * 7,
    });
  }
  nodes.length = count;
}

const smoothstep = (x: number) => x * x * (3 - 2 * x);

function drawMark(
  ctx: CanvasRenderingContext2D,
  node: WebNode,
  x: number,
  y: number,
  f: number,
  time: number,
  colours: WebColours,
) {
  const s = node.size * (0.55 + 0.45 * f);
  const quarter = Math.floor(node.phase) % 4;
  const alpha = (MAX_ALPHA * f).toFixed(3);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();

  if (node.shape === "gear") {
    // eight teeth, turning slowly
    const teeth = 8;
    const outer = s * 0.62;
    const inner = s * 0.46;
    const turn = time * 0.00025 * (node.phase > 3 ? -1 : 1) + node.phase;
    const w = (Math.PI / teeth) * 0.5;
    for (let i = 0; i < teeth; i++) {
      const a = turn + (i * Math.PI * 2) / teeth;
      const profile: [number, number][] = [
        [inner, a - w * 1.4],
        [outer, a - w * 0.7],
        [outer, a + w * 0.7],
        [inner, a + w * 1.4],
      ];
      profile.forEach(([r, t], k) => {
        const px = r * Math.cos(t);
        const py = r * Math.sin(t);
        if (i || k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
    }
    ctx.closePath();
    ctx.moveTo(s * 0.2, 0);
    ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${colours.gold},${alpha})`;
  } else if (node.shape === "circuit") {
    // a trace with right-angle bends, ending in pads
    ctx.rotate((quarter * Math.PI) / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.9, 0);
    ctx.lineTo(s * 0.9, s * 0.6);
    ctx.lineTo(s * 1.4, s * 0.6);
    ctx.moveTo(1.9, 0);
    ctx.arc(0, 0, 1.9, 0, Math.PI * 2);
    ctx.moveTo(s * 1.4 + 1.9, s * 0.6);
    ctx.arc(s * 1.4, s * 0.6, 1.9, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${colours.trace},${alpha})`;
  } else if (node.shape === "resistor") {
    ctx.rotate((quarter * Math.PI) / 2);
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 0.55, 0);
    for (let k = 0; k < 5; k++) {
      ctx.lineTo(-s * 0.55 + ((k + 0.5) * s * 1.1) / 5, (k % 2 ? 1 : -1) * s * 0.26);
    }
    ctx.lineTo(s * 0.55, 0);
    ctx.lineTo(s, 0);
    ctx.strokeStyle = `rgba(${colours.trace},${alpha})`;
  } else if (node.shape === "wave") {
    ctx.rotate(quarter % 2 ? Math.PI / 2 : 0);
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      const px = (t - 0.5) * s * 2.2;
      const py = Math.sin(t * Math.PI * 3) * s * 0.32;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = `rgba(${colours.gold},${alpha})`;
  }

  ctx.stroke();
  ctx.restore();
}

export function drawWeb(ctx: CanvasRenderingContext2D, nodes: WebNode[], o: DrawOptions) {
  const { w, h, pointer, colours } = o;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // quieter behind the copy, so the text stays clear
  const cx = w / 2;
  const cy = h / 2;
  const zoneA = Math.min(360, w * 0.3) * 1.05;
  const zoneB = Math.min(205, h * 0.27) * 1.05;
  const quiet = (x: number, y: number) =>
    Math.min(1, Math.max(0.4, (Math.hypot((x - cx) / zoneA, (y - cy) / zoneB) - 0.55) / 0.6));

  const xs = nodes.map((n) => n.u * w);
  const ys = nodes.map((n) => n.v * h);
  const zone = nodes.map((_, i) => quiet(xs[i], ys[i]));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(xs[i] - xs[j], ys[i] - ys[j]);
      if (d >= LINK) continue;
      const alpha = (1 - d / LINK) * 0.45 * Math.min(zone[i], zone[j]);
      ctx.strokeStyle = `rgba(${colours.line},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(xs[i], ys[i]);
      ctx.lineTo(xs[j], ys[j]);
      ctx.stroke();
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const x = xs[i];
    const y = ys[i];
    const d = pointer.a > 0.01 ? Math.hypot(x - pointer.x, y - pointer.y) : Infinity;
    const f = pointer.a * smoothstep(Math.max(0, 1 - d / WAKE));

    ctx.fillStyle = `rgba(${colours.line},${(0.8 * zone[i] * (1 - 0.8 * f)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (f > 0.03 && nodes[i].shape !== "dot") drawMark(ctx, nodes[i], x, y, f, o.time, colours);

    if (d < SIGHT) {
      ctx.strokeStyle = `rgba(${colours.gold},${((1 - d / SIGHT) * pointer.a * 0.42).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  if (pointer.a > 0.02) {
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `rgba(${colours.gold},${(MAX_ALPHA * pointer.a).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** "#146b84" -> "20,107,132" */
export function hexToRgb(hex: string, fallback: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  return m
    ? m
        .slice(1)
        .map((c) => parseInt(c, 16))
        .join(",")
    : fallback;
}
