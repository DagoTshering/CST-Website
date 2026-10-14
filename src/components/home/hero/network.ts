/**
 * The survey control field: slowly drifting control points over the photograph, joined by
 * faint lines that brighten near the pointer. Drawn on a canvas every frame.
 */

export type ControlPoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  gold: boolean;
  /** Distance to the pointer, updated each step. */
  d: number;
};

/** Adds or removes points so there are exactly `count`, scattered over a w×h field. */
export function resizeField(points: ControlPoint[], count: number, w: number, h: number) {
  while (points.length < count) {
    points.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.13,
      vy: (Math.random() - 0.5) * 0.13,
      r: Math.random() * 1.6 + 3.1,
      gold: Math.random() < 0.24,
      d: Infinity,
    });
  }
  points.length = count;
  for (const p of points) {
    p.x = Math.min(p.x, w);
    p.y = Math.min(p.y, h);
  }
}

/** Moves every point, bouncing off the edges. `energy` (0–1) speeds them up near the gears. */
export function stepField(
  points: ControlPoint[],
  dt: number,
  energy: number,
  w: number,
  h: number,
  pointerX: number,
  pointerY: number,
) {
  const k = (dt / 16) * (1 + energy * 0.5);
  for (const p of points) {
    p.x += p.vx * k;
    p.y += p.vy * k;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    p.x = Math.max(0, Math.min(w, p.x));
    p.y = Math.max(0, Math.min(h, p.y));
    p.d = Math.hypot(p.x - pointerX, p.y - pointerY);
  }
}

type DrawOptions = {
  w: number;
  h: number;
  link: number;
  /** "r,g,b" strings */
  ink: string;
  gold: string;
  pointer: { x: number; y: number } | null;
};

export function drawField(ctx: CanvasRenderingContext2D, points: ControlPoint[], o: DrawOptions) {
  ctx.clearRect(0, 0, o.w, o.h);
  const link2 = o.link * o.link;

  for (let a = 0; a < points.length; a++) {
    const p1 = points[a];
    for (let b = a + 1; b < points.length; b++) {
      const p2 = points[b];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dd = dx * dx + dy * dy;
      if (dd > link2) continue;
      const fade = 1 - Math.sqrt(dd) / o.link;
      let near = Math.max(0, 1 - Math.min(p1.d, p2.d) / 300);
      near *= near; // strong close in, quiet far out
      ctx.strokeStyle = `rgba(${p1.gold && p2.gold ? o.gold : o.ink},${(fade * (0.08 + near * 0.92)).toFixed(3)})`;
      ctx.lineWidth = 1 + near * 1.1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // each point is a survey mark: a cross, ringed if it is a gold control point
    let nf = Math.max(0, 1 - p1.d / 280);
    nf *= nf;
    const r = p1.r * (1 + nf * 1.15);
    const colour = p1.gold ? o.gold : o.ink;
    ctx.lineWidth = 1 + nf * 0.8;
    ctx.strokeStyle = `rgba(${colour},${(0.32 + nf * 0.68).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(p1.x - r, p1.y);
    ctx.lineTo(p1.x + r, p1.y);
    ctx.moveTo(p1.x, p1.y - r);
    ctx.lineTo(p1.x, p1.y + r);
    ctx.stroke();
    if (p1.gold) {
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, r * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }

    // sight lines from nearby points to the pointer
    if (o.pointer && p1.d < 230) {
      const cf = 1 - p1.d / 230;
      ctx.strokeStyle = `rgba(${colour},${(0.72 * cf * cf).toFixed(3)})`;
      ctx.lineWidth = 0.8 + cf * 1.3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(o.pointer.x, o.pointer.y);
      ctx.stroke();
    }
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
