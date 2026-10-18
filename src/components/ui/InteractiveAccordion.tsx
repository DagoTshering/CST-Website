"use client";

import { useId, useState, type ReactNode } from "react";

import s from "./InteractiveAccordion.module.css";

export type AccordionItem = { id: string; title: string; content: ReactNode };

/**
 * An accordion after the 21st.dev "interactive accordion": numbered items, the number's circle
 * filling with ink when its item is open, a plus that turns into a cross, a brass underline that
 * grows, and the panel opening smoothly (CSS grid rows). The first item starts open and only one
 * is open at a time. Each item is a real button (aria-expanded, aria-controls) in a heading; a
 * closed panel is inert. Reduced motion: no animation.
 */
export function InteractiveAccordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const base = useId();

  return (
    <div className={s.accordion}>
      {items.map((item, i) => {
        const isOpen = open === item.id;
        const buttonId = `${base}-${item.id}`;
        const panelId = `${buttonId}-panel`;
        return (
          <div key={item.id} className={s.item} data-open={isOpen || undefined}>
            <h3 className={s.heading}>
              <button
                id={buttonId}
                type="button"
                className={s.button}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
              >
                <span className={s.number} aria-hidden="true">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className={s.title}>{item.title}</span>
                <span className={s.plus} aria-hidden="true" />
                <span className={s.underline} aria-hidden="true" />
              </button>
            </h3>
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
