"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { pinProgress, pinScrollY } from "@/components/motion/ScrollPin";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

type CarouselProps = {
  /** Accessible name for the scrolling list. */
  label: string;
  count: number;
  /** The slides, as <li> elements. */
  children: ReactNode;
  /**
   * Inside a ScrollPin section, on a desktop: the page's scroll moves the row instead of the
   * visitor scrolling it sideways (see usePinnedTrack).
   */
  pinned?: boolean;
};

/** Where the row may be driven by the page: the pinned layouts are desktop only. */
const DRIVEN = "(min-width: 1024px)";
/** The share of the pinned scroll held still at each end, so the first and last cards rest. */
const HOLD = 0.08;

/** Progress through the pinned section -> how far along the row (0-1), held at both ends. */
const along = (p: number) => Math.min(1, Math.max(0, (p - HOLD) / (1 - 2 * HOLD)));

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Drives the row from the page scroll while its section is pinned ([data-pinned], set by
 * ScrollPin) on a desktop. The section is given --travel, the extra scroll it needs so the row
 * moves about as far as the page does (with a short rest at each end), and the row's own
 * sideways scrolling and snapping are switched off ([data-driven]) so the two never disagree.
 * Returns whether the row is being driven.
 */
function usePinnedTrack(track: RefObject<HTMLUListElement | null>, enabled: boolean) {
  const driven = useRef(false);

  useEffect(() => {
    const el = track.current;
    const section = el?.closest("section");
    if (!enabled || !el || !section) return;
    const wide = window.matchMedia(DRIVEN);

    const measure = () => {
      driven.current = wide.matches && section.hasAttribute("data-pinned");
      el.toggleAttribute("data-driven", driven.current);
      if (!driven.current) {
        section.style.removeProperty("--travel");
        return;
      }
      const max = el.scrollWidth - el.clientWidth;
      section.style.setProperty("--travel", `${Math.round(max / (1 - 2 * HOLD))}px`);
      follow();
    };
    const follow = () => {
      frame = 0;
      if (!driven.current) return;
      el.scrollLeft = along(pinProgress(section)) * (el.scrollWidth - el.clientWidth);
    };

    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(follow);
    };

    // ScrollPin marks the section after this effect has run, so watch for it
    const marks = new MutationObserver(measure);
    marks.observe(section, { attributes: true, attributeFilter: ["data-pinned"] });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    wide.addEventListener("change", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      marks.disconnect();
      resize.disconnect();
      wide.removeEventListener("change", measure);
      window.removeEventListener("scroll", onScroll);
      el.removeAttribute("data-driven");
      section.style.removeProperty("--travel");
    };
  }, [track, enabled]);

  return driven;
}

/**
 * A horizontal row of slides built on native scrolling with scroll snap, so touch, trackpad
 * and keyboard all work as expected. The buttons step one slide at a time; the counter and the
 * progress line follow the scroll position. The row starts at the content edge and runs on to
 * the edge of the window. With `pinned`, inside a pinned section on a desktop, the page's own
 * scroll moves the row instead.
 */
export function Carousel({ label, count, children, pinned = false }: CarouselProps) {
  const trackId = useId();
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  /** False when every slide is already in view, so there is nothing to step through. */
  const [scrollable, setScrollable] = useState(true);
  const driven = usePinnedTrack(track, pinned);

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
    setScrollable(end > 2);
    if (driven.current) {
      // driven by the page, the count runs evenly from the first card to the last, so it never
      // jumps at the end (where the last few cards are all in view at once)
      setIndex(end > 0 ? Math.round((el.scrollLeft / end) * (count - 1)) : 0);
      return;
    }
    // at the far end the last slide counts as current, even if it never reaches the start
    setIndex(last ? count - 1 : size ? Math.round(el.scrollLeft / size) : 0);
  }, [count, driven]);

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
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduce ? "auto" : "smooth";
    const section = el.closest("section");
    if (driven.current && section) {
      // the row follows the page, so move the page on one step of the count (see sync)
      const target = Math.min(count - 1, Math.max(0, index + direction));
      const q = count > 1 ? target / (count - 1) : 0;
      window.scrollTo({ top: pinScrollY(section, HOLD + q * (1 - 2 * HOLD)), behavior });
      return;
    }
    el.scrollBy({ left: direction * step(), behavior });
  };

  const buttonClass =
    "grid size-12 place-items-center rounded-full border border-line bg-white text-ink transition duration-200 ease-out-soft hover:border-primary-strong hover:text-primary-strong disabled:pointer-events-none disabled:opacity-35";

  return (
    <div>
      <div
        className={cx(
          "container-page flex items-center justify-between gap-6",
          // the counter and buttons only appear when there is more than fits
          !scrollable && "hidden",
        )}
      >
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
          // driven by the page: no sideways scrolling or snapping of its own
          "data-driven:snap-none data-driven:overflow-x-hidden",
          // start at the content edge, run on to the window's edge
          "px-[max(var(--gutter),calc((100%-var(--container-page))/2))] scroll-px-[max(var(--gutter),calc((100%-var(--container-page))/2))]",
        )}
      >
        {children}
      </ul>
    </div>
  );
}
