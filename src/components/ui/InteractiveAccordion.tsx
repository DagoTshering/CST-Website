"use client";

import { useId, useState, type ReactNode } from "react";

import { cx } from "@/lib/cx";

import s from "./InteractiveAccordion.module.css";

export type AccordionItem = {
  id: string;
  title: string;
  /** A muted line under the title (About's centres: the full name). */
  subtitle?: string;
  /** A small label at the end of the row, before the plus (About's centres: "Research"). */
  label?: string;
  /**
   * Something small at the end of the row, before the label, shown while the item is closed
   * (the Partners page's row of logos). Decorative: hidden from screen readers.
   */
  aside?: ReactNode;
  content: ReactNode;
};

/**
 * An accordion after the 21st.dev "interactive accordion": numbered items, the number's circle
 * filling with ink when its item is open, a plus that turns into a cross, a brass underline that
 * grows, and the panel opening smoothly (CSS grid rows). Only one item is open at a time; the
 * first starts open unless `defaultOpen` names another, or is null for none. Each item is a real
 * button (aria-expanded, aria-controls) in a heading; a closed panel is inert. Reduced motion: no
 * animation.
 *
 * Controlled, with `open` and `onToggle`: the caller keeps which items are open, any number at
 * once (the Partners page's search and "Expand all").
 */
export function InteractiveAccordion({
  items,
  defaultOpen,
  start = 1,
  wide = false,
  headingLevel = 3,
  open: openIds,
  onToggle,
}: {
  items: AccordionItem[];
  /** The item open on load: the first if left out, none if null. */
  defaultOpen?: string | null;
  /** The first item's number, for a list split into groups that number on (About's centres). */
  start?: number;
  /** Let the panel use the full width, for content with its own columns. */
  wide?: boolean;
  /** 4 when the accordion sits under an h3 of its own. */
  headingLevel?: 3 | 4;
  /** Controlled: the ids of the open items. `defaultOpen` is then ignored. */
  open?: string[];
  /** Controlled: called with an item's id when its button is pressed. */
  onToggle?: (id: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(
    defaultOpen === undefined ? (items[0]?.id ?? null) : defaultOpen,
  );
  const isOpenItem = (id: string) => (openIds ? openIds.includes(id) : open === id);
  const toggle = (id: string) => {
    if (onToggle) onToggle(id);
    else setOpen(open === id ? null : id);
  };
  const base = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={cx(s.accordion, wide && s.wide)}>
      {items.map((item, i) => {
        const isOpen = isOpenItem(item.id);
        const buttonId = `${base}-${item.id}`;
        const panelId = `${buttonId}-panel`;
        return (
          <div key={item.id} className={s.item} data-open={isOpen || undefined}>
            <Heading className={s.heading}>
              <button
                id={buttonId}
                type="button"
                className={s.button}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span className={s.number} aria-hidden="true">
                  <span>{String(start + i).padStart(2, "0")}</span>
                </span>
                {item.subtitle ? (
                  <span className={s.text}>
                    <span className={s.title}>{item.title}</span>
                    <span className={s.subtitle}>{item.subtitle}</span>
                  </span>
                ) : (
                  <span className={s.title}>{item.title}</span>
                )}
                {item.aside && (
                  <span className={s.aside} aria-hidden="true">
                    {item.aside}
                  </span>
                )}
                {item.label && <span className={s.label}>{item.label}</span>}
                <span className={s.plus} aria-hidden="true" />
                <span className={s.underline} aria-hidden="true" />
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={s.panel}
              inert={!isOpen}
            >
              <div className={s.panelInner}>
                <div className={s.content}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
