import type { CSSProperties } from "react";

import type { Programme } from "@/content/home";

/** Theme tokens for each programme's colour: [stroke and fill colour, drawing ink]. */
const TOKENS: Record<Programme["key"], [string, string]> = {
  civil: ["prog-civil", "prog-civil-ink"],
  elec: ["prog-elec", "prog-elec-ink"],
  ece: ["prog-ece", "prog-ece-ink"],
  it: ["prog-it", "prog-it-ink"],
  arch: ["prog-arch", "prog-arch-ink"],
  renew: ["prog-pg", "prog-pg-ink"],
  geo: ["prog-geo", "prog-geo-ink"],
  inst: ["prog-inst", "prog-inst-ink"],
  constr: ["prog-pg", "prog-pg-ink"],
  water: ["prog-water", "prog-water-ink"],
  mech: ["prog-mech", "prog-mech-ink"],
  soft: ["prog-soft", "prog-soft-ink"],
  resrch: ["prog-pg", "prog-pg-ink"],
};

/** Electronics draws its live traces in gold (plated copper) rather than its own black. */
const LIVE_OVERRIDE: Partial<Record<Programme["key"], string>> = { ece: "sheet-gold" };

/** CSS custom properties that colour one programme's drawing or mark. */
export function programmeColours(key: Programme["key"]) {
  const [colour, ink] = TOKENS[key];
  const live = LIVE_OVERRIDE[key] ?? colour;
  return {
    "--colour": `var(--color-${colour})`,
    "--ink": `var(--color-${ink})`,
    "--live": `var(--color-${live})`,
  } as CSSProperties;
}
