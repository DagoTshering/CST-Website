"use client";

import { useState, type ReactNode } from "react";

import t from "@/components/ui/Tabs.module.css";

import s from "./EuProjects.module.css";

type Status = "all" | "active" | "completed";

const TABS: { status: Status; label: string }[] = [
  { status: "all", label: "All projects" },
  { status: "active", label: "Active" },
  { status: "completed", label: "Completed" },
];

/**
 * The status tabs and the groups of projects they filter, in place (no change of URL). The
 * groups not chosen are hidden by CSS, so every project is in the page whichever tab is chosen.
 */
export function StatusFilter({
  counts,
  children,
}: {
  counts: Record<Status, number>;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<Status>("all");

  return (
    <div className={s.filter} data-status={status}>
      <div className={t.tabs} role="group" aria-label="Show projects">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            className={t.tab}
            aria-pressed={tab.status === status}
            onClick={() => setStatus(tab.status)}
          >
            {tab.label} <span className={t.count}>{counts[tab.status]}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
