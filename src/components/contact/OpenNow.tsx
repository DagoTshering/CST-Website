"use client";

import { useEffect, useState } from "react";

import type { Hours } from "@/lib/contact";

import s from "./Contact.module.css";

const DAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Whether the office is open, in the office's own time zone, and when that changes. */
function status(hours: Hours, now: Date): { headline: string; detail: string } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: hours.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const day = DAYS[part("weekday")];
    const minute = Number(part("hour")) * 60 + Number(part("minute"));
    const open = minutesOf(hours.open);
    const close = minutesOf(hours.close);
    if (day === undefined || Number.isNaN(minute)) return null;

    if (hours.days.includes(day) && minute >= open && minute < close) {
      const left = close - minute;
      const h = Math.floor(left / 60);
      const m = left % 60;
      const inTime = [h && `${h} h`, m && `${m} min`].filter(Boolean).join(" ");
      return {
        headline: "The office is open now",
        detail: `Closes at ${hours.close} Bhutan time, in ${inTime}.`,
      };
    }

    // the next opening: later today, or the next day the office opens
    let ahead = 0;
    let next = day;
    if (!(hours.days.includes(day) && minute < open)) {
      do {
        next = (next + 1) % 7;
        ahead += 1;
      } while (!hours.days.includes(next) && ahead < 7);
    }
    const when = ahead === 0 ? "today" : ahead === 1 ? "tomorrow" : NAMES[next];
    return {
      headline: "The office is closed right now",
      detail: `Opens ${when} at ${hours.open} Bhutan time.`,
    };
  } catch {
    return null;
  }
}

/**
 * The live open or closed line under the office hours. It follows the regular hours only (not
 * public holidays), so it says nothing more than that. Rendered after mount only, as the server
 * cannot know the visitor's moment; it updates every half minute.
 */
export function OpenNow({ hours }: { hours: Hours }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const result = now && status(hours, now);
  if (!result) return null;
  return (
    <p className={s.openNow}>
      <strong>{result.headline}</strong>
      {result.detail}
    </p>
  );
}
