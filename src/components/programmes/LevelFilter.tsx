import Link from "next/link";
import type { ReactNode } from "react";

import s from "./Programmes.module.css";

export type Level = "all" | "bachelor" | "master";

const TABS: { level: Level; label: string; href: string }[] = [
  { level: "all", label: "All programmes", href: "/programmes" },
  { level: "bachelor", label: "Bachelor's", href: "/programmes?level=bachelor" },
  { level: "master", label: "Master's", href: "/programmes?level=master" },
];

export const levelOf = (value: string | null): Level =>
  value === "bachelor" || value === "master" ? value : "all";

/**
 * The level tabs and the groups of programmes they filter. Each tab is a link to its own view
 * (?level=), so a filtered list can be shared; the groups not in view are hidden by CSS, so every
 * programme is in the page for search engines either way.
 */
export function LevelFilter({ level, children }: { level: Level; children: ReactNode }) {
  return (
    <div className={s.filter} data-level={level}>
      <nav className={s.tabs} aria-label="Programme level">
        {TABS.map((tab) => (
          <Link
            key={tab.level}
            href={tab.href}
            scroll={false}
            prefetch={false}
            className={s.tab}
            aria-current={tab.level === level ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
