"use client";

import { useState, type ReactNode } from "react";

import t from "@/components/ui/Tabs.module.css";

import s from "./Events.module.css";

type When = "all" | "upcoming" | "past";

const TABS: { when: When; label: string }[] = [
  { when: "all", label: "All events" },
  { when: "upcoming", label: "Upcoming" },
  { when: "past", label: "Past" },
];

/**
 * The When tabs and the groups of events they filter, in place (no change of URL), as on EU
 * Projects. The groups not chosen are hidden by CSS, so every event is in the page whichever tab
 * is chosen.
 */
export function WhenFilter({
  counts,
  children,
}: {
  counts: Record<When, number>;
  children: ReactNode;
}) {
  const [when, setWhen] = useState<When>("all");

  return (
    <div className={s.filter} data-when={when}>
      <div className={t.tabs} role="group" aria-label="Show events">
        {TABS.map((tab) => (
          <button
            key={tab.when}
            type="button"
            className={t.tab}
            aria-pressed={tab.when === when}
            onClick={() => setWhen(tab.when)}
          >
            {tab.label} <span className={t.count}>{counts[tab.when]}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
