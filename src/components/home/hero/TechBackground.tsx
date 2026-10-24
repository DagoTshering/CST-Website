"use client";

import { useEffect, useRef } from "react";

import { cx } from "@/lib/cx";

/**
 * TechBackground: a quiet, live blueprint layer for a hero section.
 *
 * - a major grid that bends slightly away from the pointer and brightens around it
 * - two slow graph traces (an oscilloscope sine and a sensor-style data line) whose
 *   amplitude rises a little when the pointer is near
 * - a faint crosshair with a coordinate readout that follows the pointer
 *
 * It listens to the pointer on its parent element, so it works under other content
 * (text, a WebGL canvas). It sets --tech-px / --tech-py on the parent (-1..1) so other
 * decorations can parallax with the pointer. Static frame for prefers-reduced-motion.
 */
export function TechBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const TEAL = "46,125,143",
      GOLD = "184,146,74";
    let w = 0,
      h = 0,
      dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // pointer, eased
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: 0, ton: 0 };
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      m.ton = inside && e.pointerType === "mouse" ? 1 : 0;
      if (inside) {
        m.tx = x;
        m.ty = y;
        if (m.x < -999) {
          m.x = x;
          m.y = y;
        }
        host.style.setProperty("--tech-px", ((x / r.width) * 2 - 1).toFixed(3));
        host.style.setProperty("--tech-py", ((y / r.height) * 2 - 1).toFixed(3));
      }
    };
    const leave = () => (m.ton = 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);

    // sensor trace: a smoothed random walk that scrolls left
    const N = 160;
    const data = new Float32Array(N);
    let seed = 11,
      v = 0;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const step = () => {
      v = v * 0.86 + (rnd() - 0.5) * 0.9;
      return v;
    };
    for (let i = 0; i < N; i++) data[i] = step();
    let scroll = 0;

    const SPACING = 48,
      SIGMA = 150,
      PUSH = 9;
    const falloff = (x: number, y: number) => {
      const dx = x - m.x,
        dy = y - m.y;
      return Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA)) * m.on;
    };

    let raf = 0,
      last = performance.now(),
      t = 0,
      visible = true;
    const io = new IntersectionObserver((en) => (visible = en[0].isIntersecting), { threshold: 0 });
    io.observe(host);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      t += dt;
      const k = 1 - Math.exp(-dt * 8);
      m.x += (m.tx - m.x) * k;
      m.y += (m.ty - m.y) * k;
      m.on += (m.ton - m.on) * (1 - Math.exp(-dt * 4));
      ctx.clearRect(0, 0, w, h);

      // ---- grid, bent around the pointer ----
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 260);
      g.addColorStop(0, `rgba(${TEAL},${0.1 + 0.22 * m.on})`);
      g.addColorStop(1, `rgba(${TEAL},0.1)`);
      ctx.strokeStyle = m.on > 0.01 ? g : `rgba(${TEAL},0.1)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const seg = 16;
      for (let x0 = 0; x0 <= w + SPACING; x0 += SPACING) {
        for (let y = 0; y <= h + seg; y += seg) {
          const f = falloff(x0, y);
          const dx = x0 - m.x,
            dist = Math.hypot(dx, y - m.y) || 1;
          const x = x0 + (dx / dist) * PUSH * f;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      for (let y0 = 0; y0 <= h + SPACING; y0 += SPACING) {
        for (let x = 0; x <= w + seg; x += seg) {
          const f = falloff(x, y0);
          const dy = y0 - m.y,
            dist = Math.hypot(x - m.x, dy) || 1;
          const y = y0 + (dy / dist) * PUSH * f;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // grid nodes light up near the pointer
      if (m.on > 0.01) {
        for (let x = 0; x <= w; x += SPACING)
          for (let y = 0; y <= h; y += SPACING) {
            const f = falloff(x, y);
            if (f < 0.05) continue;
            ctx.fillStyle = `rgba(${TEAL},${0.55 * f})`;
            ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
          }
      }

      // ---- oscilloscope trace along the lower band ----
      const scopeY = h * 0.86;
      const scope = (amp: number, freq: number, speed: number, color: string, phase: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const near = falloff(x, scopeY);
          const a = amp * (1 + 1.6 * near);
          const y =
            scopeY +
            Math.sin(x * freq + t * speed + phase) * a +
            Math.sin(x * freq * 3.1 + t * speed * 1.7) * a * 0.18;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      ctx.save();
      ctx.globalAlpha = 0.9;
      scope(9, 0.012, 1.1, `rgba(${TEAL},0.32)`, 0);
      scope(6, 0.019, -0.8, `rgba(${GOLD},0.28)`, 1.4);
      ctx.restore();
      // scope axis and ticks
      ctx.strokeStyle = `rgba(${TEAL},0.18)`;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(0, scopeY);
      ctx.lineTo(w, scopeY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ---- sensor data line along the upper band ----
      scroll += dt * 18;
      while (scroll >= w / N) {
        scroll -= w / N;
        data.copyWithin(0, 1);
        data[N - 1] = step();
      }
      const dataY = w < 1024 ? 18 : h * 0.12,
        dx = w / (N - 1); // keep the trace clear of the headline
      ctx.strokeStyle = `rgba(${TEAL},0.28)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i * dx - scroll;
        const near = falloff(x, dataY);
        const y = dataY + data[i] * 16 * (1 + 1.2 * near);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // sample markers on the data line
      ctx.fillStyle = `rgba(${TEAL},0.4)`;
      for (let i = 0; i < N; i += 12) {
        const x = i * dx - scroll;
        ctx.fillRect(x - 1.5, dataY + data[i] * 16 * (1 + 1.2 * falloff(x, dataY)) - 1.5, 3, 3);
      }

      // ---- crosshair and readout ----
      if (m.on > 0.01) {
        ctx.strokeStyle = `rgba(${TEAL},${0.22 * m.on})`;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(0, m.y);
        ctx.lineTo(w, m.y);
        ctx.moveTo(m.x, 0);
        ctx.lineTo(m.x, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(${TEAL},${0.6 * m.on})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 9, 0, Math.PI * 2);
        ctx.moveTo(m.x - 14, m.y);
        ctx.lineTo(m.x - 5, m.y);
        ctx.moveTo(m.x + 5, m.y);
        ctx.lineTo(m.x + 14, m.y);
        ctx.moveTo(m.x, m.y - 14);
        ctx.lineTo(m.x, m.y - 5);
        ctx.moveTo(m.x, m.y + 5);
        ctx.lineTo(m.x, m.y + 14);
        ctx.stroke();
        ctx.fillStyle = `rgba(${TEAL},${0.7 * m.on})`;
        ctx.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(
          `X ${String(Math.round(m.x)).padStart(4, "0")}  Y ${String(Math.round(m.y)).padStart(4, "0")}`,
          m.x + 16,
          m.y - 12,
        );
      }

      if (reduce) cancelAnimationFrame(raf); // one static frame
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cx("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
