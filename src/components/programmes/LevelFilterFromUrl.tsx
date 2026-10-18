"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { LevelFilter, levelOf } from "./LevelFilter";

/** The level filter, following the address's ?level= (in a Suspense boundary: see the page). */
export function LevelFilterFromUrl({ children }: { children: ReactNode }) {
  const level = levelOf(useSearchParams().get("level"));
  return <LevelFilter level={level}>{children}</LevelFilter>;
}
