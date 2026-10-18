"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import type { StaffMember } from "@/content/staff";

import s from "./StaffCarousel.module.css";
import { StaffDetails } from "./StaffDetails";
import { StaffPhoto } from "./StaffPhoto";

/**
 * Groups this size and up carry on from the last person back to the first (forwards only: a
 * group starts at its first person, with nothing before it). Smaller ones stop at each end, so
 * no face repeats.
 */
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

/** The phone tier, where the active card shows its photo first and turns over for the details. */
const PHONE = "(max-width: 767.98px)";
const onPhoneChange = (notify: () => void) => {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const isPhone = () => window.matchMedia(PHONE).matches;

/** How the cards move from place to place: a spring, as in the connected carousel on 21st.dev. */
const SPRING: Transition = { type: "spring", stiffness: 220, damping: 26, mass: 0.75 };
/** A side card's photo fading out as it becomes the active card (and back in as it leaves). */
const THUMB_FADE: Transition = { duration: 0.22, ease: "easeOut" };
/** No movement: the first placement, while the window is resized, and for reduced motion. */
const INSTANT: Transition = { duration: 0 };

type Tier = "phone" | "tablet" | "desktop";
/** The panel the cards are placed in: the screen's tier, and the panel's width and height. */
type Panel = { tier: Tier; width: number; height: number };
/** A card's place: left edge and top from the panel's centre, size, and whether it shows. */
type Place = { x: number; y: number; width: number; height: number; opacity: number };

/**
 * Where the card `o` places from the active one goes (the prototype's geometry). Widths are
 * fixed per tier; heights are shares of the panel's height, which shrinks so that a department
 * fits one screen (StaffCarousel.module.css). Keep the tiers in step with the CSS (--aw, --gap).
 */
function placeOf(o: number, { tier, width: panelWidth, height: h }: Panel): Place {
  const place = (x: number, width: number, height: number, opacity = 1): Place => ({
    x,
    y: -height / 2,
    width,
    height,
    opacity,
  });
  if (tier === "phone") {
    const aw = Math.min(340, panelWidth - 68);
    const [gap, pw, ph, fh] = [12, 60, h - 80, h * 0.4];
    if (o === 0) return place(-aw / 2, aw, h);
    if (o === -1) return place(-aw / 2 - gap - pw, pw, ph);
    if (o === 1) return place(aw / 2 + gap, pw, ph);
    return place(o < 0 ? -aw / 2 - 220 - pw : aw / 2 + 220, pw, fh, 0);
  }
  if (tier === "tablet") {
    const [aw, gap, pw, ph, fh] = [560, 18, 100, (h * 340) / 440, h * 0.4];
    if (o === 0) return place(-aw / 2, aw, h);
    if (o === -1) return place(-aw / 2 - gap - pw, pw, ph);
    if (o === 1) return place(aw / 2 + gap, pw, ph);
    return place(o < 0 ? -594 : 520, 74, fh, 0);
  }
  const [ph, fh] = [(h * 344) / 513, (h * 205) / 513];
  switch (o) {
    case 0:
      return place(-381, 762, h);
    case -1:
      return place(-506, 105, ph);
    case 1:
      return place(401, 105, ph);
    case -2:
      return place(-596, 74, fh);
    case 2:
      return place(522, 74, fh);
    case -3:
      return place(-720, 74, fh, 0);
    case 3:
      return place(646, 74, fh, 0);
    default:
      return place(o < 0 ? -860 : 860, 74, fh, 0);
  }
}

const tierOf = (width: number): Tier =>
  width < 768 ? "phone" : width < 1120 ? "tablet" : "desktop";

/** The notch that joins a side card to its neighbour (scaled to the gap by CSS). */
const CONNECTOR =
  "M0 0C0 0 1.2422 13.5759 10 13.5759C18.7578 13.5759 20 0 20 0V37.3338C20 37.3338 18.7578 23.7578 10 23.7578C1.2422 23.7578 0 37.3338 0 37.3338V0Z";

/** A portrait that only redraws if its person changes: a move re-renders the cards, not their photos. */
const Photo = memo(StaffPhoto);

type CardInsideProps = {
  person: StaffMember;
  /** The id of the details, which the photo face's button controls. */
  detailsId: string;
  active: boolean;
  /** Phones: the active card is turned over to its details. */
  flipped: boolean;
  phone: boolean;
  onTurn: (toDetails: boolean) => void;
};

/**
 * The active card's contents: the details, the photo beside them, and on a phone the photo face
 * that turns the card over. Memoised, so a move only redraws the two cards whose role changes.
 */
const CardInside = memo(function CardInside({
  person,
  detailsId,
  active,
  flipped,
  phone,
  onTurn,
}: CardInsideProps) {
  return (
    <>
      {/* on a phone, the card's back: hidden until the card is turned over */}
      <div id={detailsId} className={s.info} inert={phone && !(active && flipped)}>
        <h3 className={s.name}>{person.name}</h3>
        <StaffDetails person={person} className={s.details} />
        <button type="button" className={s.flipBack} data-face="back" onClick={() => onTurn(false)}>
          <svg viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d="M18 5H1M5.5 .8L1 5l4.5 4.2" />
          </svg>
          Back to photo
        </button>
      </div>
      <div className={`crop-marks ${s.portrait}`}>
        <Photo person={person} sizes={PHOTO_SIZES} className={s.fill} />
      </div>
      {/* on a phone, the card's face: the photo alone, which turns it over */}
      <button
        type="button"
        className={s.front}
        data-face="front"
        inert={phone && active && flipped}
        aria-expanded={active && flipped}
        aria-controls={detailsId}
        aria-label={`More details about ${person.name}`}
        onClick={() => onTurn(true)}
      >
        <Photo person={person} alt="" sizes={PHOTO_SIZES} className={s.fill} />
        <span className={s.frontLabel} aria-hidden="true">
          More details
        </span>
      </button>
    </>
  );
});

type StaffCarouselProps = {
  people: StaffMember[];
  /** The department's name, for the carousel's accessible name. */
  label: string;
};

/**
 * A department's people as a connected carousel: the active person on a large card (details
 * and photo), their neighbours as narrow photo cards joined to it by notches. A side card, the
 * arrow keys, a swipe or the dots move it on; there is no autoplay. On a phone the active card
 * shows the photo alone; tapping it ("More details") turns the card over to the details.
 *
 * Every card's place comes from placeOf (its offset to the active card, the screen's tier and
 * the panel's size) and framer-motion springs it there; the side photo fades, and the active
 * card's details slide in on the same spring. The panel is measured once mounted (and on resize),
 * so the cards are hidden until then rather than shown in the wrong places.
 */
export function StaffCarousel({ people, label }: StaffCarouselProps) {
  const total = people.length;
  const loop = total >= LOOP_FROM;
  /** The active card's position on an endless strip; wrapped onto `people` when looping. */
  const [page, setPage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  /** Phones: whether the active card is turned over to its details. */
  const [flipped, setFlipped] = useState(false);
  /** Set when the visitor turns the card, so focus moves to the face that comes up. */
  const focusFace = useRef(false);
  const phone = useSyncExternalStore(onPhoneChange, isPhone, () => false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  /** The measured panel; null until the carousel has mounted. */
  const [panel, setPanel] = useState<Panel | null>(null);
  /** Whether cards jump to their places rather than spring there (first placement, resizing). */
  const [snap, setSnap] = useState(true);
  const reducedMotion = useReducedMotion();
  const focusTab = useRef(false);
  const swipeFrom = useRef<number | null>(null);
  const swiped = useRef(false);
  const id = useId();
  const panelId = `${id}-panel`;
  const hintId = `${id}-hint`;

  const wrap = (v: number) => (loop ? ((v % total) + total) % total : v);
  const current = wrap(page);

  /** Whether there is anyone before the active person (never before the first, at the start). */
  const canBack = page > 0;
  /** Whether there is anyone after: always in a group that carries on round, else until the last. */
  const canOn = loop || page < total - 1;

  function go(delta: number) {
    // never back past the start; forwards past the last only in a group that carries on round
    const next = Math.max(0, loop ? page + delta : Math.min(total - 1, page + delta));
    if (next === page) return;
    setPage(next);
    setFlipped(false); // the next person shows their photo first
    const index = wrap(next);
    setAnnouncement(`${people[index].name}, ${index + 1} of ${total}`);
  }

  /** To a person by index: the short way round in a group that carries on, but never back past the start. */
  function goTo(index: number) {
    let delta = index - current;
    if (loop && delta < -total / 2) delta += total;
    else if (loop && delta > total / 2 && page + delta - total >= 0) delta -= total;
    go(delta);
  }

  /** Phones: turns the active card over (true: to the details) and focuses the face that comes up. */
  const turn = useCallback((toDetails: boolean) => {
    if (swiped.current) return; // the tap that ends a swipe is not a turn
    focusFace.current = true;
    setFlipped(toDetails);
  }, []);

  useEffect(() => {
    if (!focusFace.current) return;
    focusFace.current = false;
    rootRef.current
      ?.querySelector<HTMLElement>(
        `[aria-roledescription="slide"] [data-face="${flipped ? "back" : "front"}"]`,
      )
      ?.focus();
  }, [flipped]);

  // After a key press on a dot, focus follows the selected dot (a roving tab stop).
  useEffect(() => {
    if (!focusTab.current) return;
    focusTab.current = false;
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, [page]);

  // Measures the panel: once mounted, again when the headings' web font arrives (it can change
  // the panel's height), and on resize. The first placement and resizes jump rather than spring.
  useEffect(() => {
    const element = panelRef.current;
    if (!element) return;
    let timer = 0;
    let frame = 0;
    const measure = () =>
      setPanel({
        tier: tierOf(window.innerWidth),
        width: element.clientWidth,
        height: element.clientHeight,
      });
    frame = requestAnimationFrame(() => {
      measure();
      frame = requestAnimationFrame(() => setSnap(false));
    });
    document.fonts?.ready.then(measure);
    const onResize = () => {
      setSnap(true);
      measure();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSnap(false), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  const still = snap || reducedMotion;
  /** Until measured, places for a desktop panel: the cards are hidden then anyway. */
  const at = panel ?? { tier: "desktop" as const, width: 1200, height: 513 };

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
    // nobody before the start; past the last, only a group that carries on round
    if (v >= 0 && (loop || v < total)) offsets.push(o);
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

      <div
        ref={panelRef}
        id={panelId}
        className={s.panel}
        data-measuring={panel === null || undefined}
      >
        {offsets.map((o) => {
          const v = page + o;
          const person = people[wrap(v)];
          const active = o === 0;
          return (
            <motion.div
              // a place on the strip, not a person: a looping group can show someone twice
              key={v}
              className={s.card}
              initial={false}
              animate={placeOf(o, at)}
              transition={still ? INSTANT : SPRING}
              data-o={Math.max(-3, Math.min(3, o))}
              data-flipped={(active && flipped) || undefined}
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
                <motion.div
                  className={s.thumb}
                  initial={false}
                  animate={{ opacity: active ? 0 : 1 }}
                  transition={still ? INSTANT : THUMB_FADE}
                >
                  <Photo person={person} alt="" sizes={PHOTO_SIZES} className={s.fill} />
                </motion.div>
                <div className={s.stage}>
                  <motion.div
                    className={s.body}
                    inert={!active}
                    initial={false}
                    animate={{ opacity: active ? 1 : 0, x: active ? 0 : o < 0 ? -822 : 822 }}
                    transition={still ? INSTANT : SPRING}
                  >
                    <CardInside
                      person={person}
                      detailsId={`${id}-details-${v}`}
                      active={active}
                      flipped={active && flipped}
                      phone={phone}
                      onTurn={turn}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className={s.nav}>
        <button
          type="button"
          className={s.arrow}
          aria-label="Previous person"
          aria-controls={panelId}
          disabled={!canBack}
          onClick={() => go(-1)}
        >
          <svg viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d="M18 5H1M5.5 .8L1 5l4.5 4.2" />
          </svg>
        </button>
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
        <button
          type="button"
          className={s.arrow}
          aria-label="Next person"
          aria-controls={panelId}
          disabled={!canOn}
          onClick={() => go(1)}
        >
          <svg viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d="M0 5H17M12.5 .8L17 5l-4.5 4.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
