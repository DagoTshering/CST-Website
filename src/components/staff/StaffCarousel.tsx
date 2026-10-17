"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import type { StaffMember } from "@/content/staff";

import s from "./StaffCarousel.module.css";
import { StaffDetails } from "./StaffDetails";
import { StaffPhoto } from "./StaffPhoto";

/** Groups this size and up wrap round; smaller ones stop at each end so no face repeats. */
const LOOP_FROM = 5;
/** Cards kept in the page each side of the active one (the outer ones wait off stage). */
const RANGE = 5;
/** How far a pointer must travel, in px, to count as a swipe. */
const SWIPE = 60;
/** On a phone, groups larger than this show that many dots at a time (see --view in the CSS). */
const DOT_WINDOW = 11;
/**
 * The side cards show a thumbnail of the same portrait as the active card's photo; one `sizes`
 * for both lets the browser reuse the one download.
 */
const PHOTO_SIZES = "(max-width: 767px) 340px, 290px";

/** The notch that joins a side card to its neighbour (scaled to the gap by CSS). */
const CONNECTOR =
  "M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z";

type StaffCarouselProps = {
  people: StaffMember[];
  /** The department's name, for the carousel's accessible name. */
  label: string;
};

/**
 * A department's people as a connected carousel: the active person on a large card (details
 * and photo), their neighbours as narrow photo cards joined to it by notches. A side card, the
 * arrow keys, a swipe or the dots move it on; there is no autoplay.
 *
 * Every card's place comes from CSS (StaffCarousel.module.css), from its offset to the active
 * card in data-o and the screen's width, so the server renders the right layout for any screen
 * and nothing jumps on hydration. JavaScript only tracks which person is active.
 */
export function StaffCarousel({ people, label }: StaffCarouselProps) {
  const total = people.length;
  const loop = total >= LOOP_FROM;
  /** The active card's position on an endless strip; wrapped onto `people` when looping. */
  const [page, setPage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const focusTab = useRef(false);
  const swipeFrom = useRef<number | null>(null);
  const swiped = useRef(false);
  const id = useId();
  const panelId = `${id}-panel`;
  const hintId = `${id}-hint`;

  const wrap = (v: number) => (loop ? ((v % total) + total) % total : v);
  const current = wrap(page);

  function go(delta: number) {
    const next = loop ? page + delta : Math.max(0, Math.min(total - 1, page + delta));
    if (next === page) return;
    setPage(next);
    const index = wrap(next);
    setAnnouncement(`${people[index].name}, ${index + 1} of ${total}`);
  }

  /** To a person by index, the short way round when looping. */
  function goTo(index: number) {
    let delta = index - current;
    if (loop && delta > total / 2) delta -= total;
    else if (loop && delta < -total / 2) delta += total;
    go(delta);
  }

  // After a key press on a dot, focus follows the selected dot (a roving tab stop).
  useEffect(() => {
    if (!focusTab.current) return;
    focusTab.current = false;
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, [page]);

  // While the window is resized the cards snap to their new places instead of gliding there.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const onResize = () => {
      root.setAttribute("data-resizing", "");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.removeAttribute("data-resizing"), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const onTab = (event.target as HTMLElement).getAttribute("role") === "tab";
    // keys pressed on a link inside the card keep their usual meaning
    if (event.target !== event.currentTarget && !onTab) return;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => go(-1),
      ArrowRight: () => go(1),
      // Home and End only from the dots, so they still scroll the page from the carousel itself
      ...(onTab && { Home: () => goTo(0), End: () => goTo(total - 1) }),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    focusTab.current = onTab;
    action();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swiped.current = false;
    swipeFrom.current = event.pointerType === "mouse" && event.button !== 0 ? null : event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (from === null || Math.abs(event.clientX - from) < SWIPE) return;
    swiped.current = true; // the click that ends a swipe on a side card is not a second move
    go(event.clientX < from ? 1 : -1);
  }

  const offsets: number[] = [];
  for (let o = -RANGE; o <= RANGE; o++) {
    const v = page + o;
    if (loop || (v >= 0 && v < total)) offsets.push(o);
  }

  return (
    <div
      ref={rootRef}
      className={s.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${label} staff`}
      aria-describedby={hintId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipeFrom.current = null)}
    >
      <p id={hintId} hidden>
        Use the left and right arrow keys to move between people.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div id={panelId} className={s.panel}>
        {offsets.map((o) => {
          const v = page + o;
          const person = people[wrap(v)];
          const active = o === 0;
          return (
            <div
              // a place on the strip, not a person: a looping group can show someone twice
              key={v}
              className={s.card}
              data-o={Math.max(-3, Math.min(3, o))}
              {...(active
                ? {
                    role: "group",
                    "aria-roledescription": "slide",
                    "aria-label": `${current + 1} of ${total}`,
                  }
                : { "aria-hidden": true })}
              onClick={
                active
                  ? undefined
                  : () => {
                      if (!swiped.current) go(o);
                    }
              }
            >
              <span className={s.connector} aria-hidden="true">
                <svg viewBox="0 0 20 37.3338" preserveAspectRatio="none" focusable="false">
                  <path d={CONNECTOR} />
                </svg>
              </span>
              <div className={s.clip}>
                <div className={s.thumb}>
                  <StaffPhoto person={person} alt="" sizes={PHOTO_SIZES} className={s.fill} />
                </div>
                <div className={s.stage}>
                  <div className={s.body} inert={!active}>
                    <div className={s.info}>
                      <h3 className={s.name}>{person.name}</h3>
                      <StaffDetails person={person} className={s.details} />
                    </div>
                    <div className={`crop-marks ${s.portrait}`}>
                      <StaffPhoto person={person} sizes={PHOTO_SIZES} className={s.fill} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        ref={tabsRef}
        className={s.dots}
        role="tablist"
        aria-label={`People in ${label}`}
        // on a phone a long row shows a window of dots that follows the selected one
        data-many={total > DOT_WINDOW || undefined}
        style={{ "--i": current, "--n": total } as CSSProperties}
      >
        <div className={s.track}>
          {people.map((person, i) => (
            <button
              key={person.id}
              type="button"
              role="tab"
              className={s.dot}
              aria-selected={i === current}
              aria-controls={panelId}
              aria-label={`${person.name}, ${person.designation}`}
              title={person.name}
              tabIndex={i === current ? 0 : -1}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
