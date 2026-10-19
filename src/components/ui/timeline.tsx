"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { cx } from "@/lib/cx";

import s from "./timeline.module.css";

export type TimelineEntry = { title: string; content: ReactNode };

/**
 * A scroll-driven timeline, after the 21st.dev "Timeline" (Aceternity). An ordered list: each
 * entry's title (a year) sits in a sticky column beside its content, with a round marker on a
 * hairline that runs down the left. As the page scrolls, a brass-to-teal line fills the hairline
 * (useScroll over the list, from its top at 10% of the screen to its end at the middle); each
 * marker fills and its title comes up to full strength once the line reaches it. Below 900px the
 * title sits above the content and nothing is sticky. Reduced motion: the line is drawn in full
 * and every entry is shown as reached.
 */
export function Timeline({
  data,
  className,
  "aria-labelledby": labelledBy,
}: {
  data: TimelineEntry[];
  className?: string;
  "aria-labelledby"?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLOListElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [height, setHeight] = useState(0);
  const [reached, setReached] = useState(0);
  const reduced = useReducedMotion();

  // the list's height, which the line grows to; fonts and photographs loading can change it
  useEffect(() => {
    const measure = () => {
      if (ref.current) setHeight(ref.current.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    document.fonts?.ready.then(measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // how many markers the line has reached: measured live, since the sticky markers move
  const track = useCallback((line: number) => {
    const list = ref.current;
    if (!list) return;
    const top = list.getBoundingClientRect().top;
    let count = 0;
    for (const dot of dots.current) {
      if (!dot) continue;
      const box = dot.getBoundingClientRect();
      if (line > 0 && box.top + box.height / 2 - top <= line) count += 1;
    }
    setReached(count);
  }, []);
  useMotionValueEvent(heightTransform, "change", track);

  return (
    <div ref={containerRef} className={cx(s.timeline, className)}>
      <ol ref={ref} className={s.list} aria-labelledby={labelledBy}>
        {data.map((item, i) => (
          <li
            key={item.title}
            className={s.entry}
            data-reached={reduced || i < reached || undefined}
          >
            <div className={s.marker}>
              <span
                ref={(el) => {
                  dots.current[i] = el;
                }}
                className={s.dot}
                aria-hidden="true"
              />
              <span className={s.title}>{item.title}</span>
            </div>
            <div className={s.content}>{item.content}</div>
          </li>
        ))}
      </ol>
      <div className={s.track} aria-hidden="true">
        {reduced ? (
          <div className={s.fill} style={{ height: "100%" }} />
        ) : (
          <motion.div
            className={s.fill}
            style={{ height: heightTransform, opacity: opacityTransform }}
          />
        )}
      </div>
    </div>
  );
}
