"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

type CarouselProps = {
  /** Accessible name for the scrolling list. */
  label: string;
  count: number;
  /** The slides, as <li> elements. */
  children: ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A horizontal row of slides built on native scrolling with scroll snap, so touch, trackpad
 * and keyboard all work as expected. The buttons step one slide at a time; the counter and the
 * progress line follow the scroll position. The row starts at the content edge and runs on to
 * the edge of the window.
 */
export function Carousel({ label, count, children }: CarouselProps) {
  const trackId = useId();
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const step = () => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return first.offsetWidth + gap;
  };

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const size = step();
    const end = el.scrollWidth - el.clientWidth;
    const last = el.scrollLeft >= end - 2;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(last);
    // at the far end the last slide counts as current, even if it never reaches the start
    setIndex(last ? count - 1 : size ? Math.round(el.scrollLeft / size) : 0);
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    sync();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sync]);

  const go = (direction: -1 | 1) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollBy({ left: direction * step(), behavior: reduce ? "auto" : "smooth" });
  };

  const buttonClass =
    "grid size-12 place-items-center rounded-full border border-line bg-white text-ink transition duration-200 ease-out-soft hover:border-primary-strong hover:text-primary-strong disabled:pointer-events-none disabled:opacity-35";

  return (
    <div>
      <div className="container-page flex items-center justify-between gap-6">
        <div className="flex items-center gap-4" aria-hidden="true">
          <span className="font-mono text-small tracking-[0.08em] text-ink tabular-nums">
            {pad(index + 1)} <span className="text-muted">/ {pad(count)}</span>
          </span>
          <span className="relative block h-px w-24 overflow-hidden bg-line sm:w-40">
            <span
              className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-500 ease-out-soft"
              style={{ width: `${((index + 1) / count) * 100}%` }}
            />
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            aria-controls={trackId}
            onClick={() => go(-1)}
            disabled={atStart}
            className={buttonClass}
          >
            <ChevronLeftIcon className="size-5" />
            <span className="sr-only">Previous</span>
          </button>
          <button
            type="button"
            aria-controls={trackId}
            onClick={() => go(1)}
            disabled={atEnd}
            className={buttonClass}
          >
            <ChevronRightIcon className="size-5" />
            <span className="sr-only">Next</span>
          </button>
        </div>
      </div>

      <ul
        ref={track}
        id={trackId}
        aria-label={label}
        tabIndex={0}
        className={cx(
          "mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] lg:gap-8 [&::-webkit-scrollbar]:hidden",
          // start at the content edge, run on to the window's edge
          "px-[max(var(--gutter),calc((100%-var(--container-page))/2))] scroll-px-[max(var(--gutter),calc((100%-var(--container-page))/2))]",
        )}
      >
        {children}
      </ul>
    </div>
  );
}
