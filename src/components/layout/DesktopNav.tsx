"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { isNavGroup, type NavItem } from "@/content/site";
import { cx } from "@/lib/cx";

const HOVER_OPEN_MS = 60;
const HOVER_CLOSE_MS = 160;

const itemClass =
  "relative inline-flex h-(--header-nav-h) items-center gap-1.5 px-4 font-display text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:text-primary-strong " +
  "after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out-soft hover:after:scale-x-100";

const activeClass = "text-primary-strong after:scale-x-100";

/**
 * Desktop menu bar, following the WAI-ARIA disclosure navigation pattern: items without a page
 * are buttons that show their submenu. A submenu opens on click, or on hover with a mouse, and
 * closes on Escape, on a click elsewhere, or when focus leaves it.
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimer = useRef<number | undefined>(undefined);
  const openedByHover = useRef(false);

  useEffect(() => {
    if (open === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      buttons.current[open]?.focus();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const hover = (index: number | null, delay: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      openedByHover.current = index !== null;
      setOpen(index);
    }, delay);
  };

  const toggle = (index: number) => {
    window.clearTimeout(hoverTimer.current);
    // A click right after hover opened the menu should keep it open, not close it again.
    if (open === index && openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setOpen(open === index ? null : index);
  };

  return (
    <nav ref={navRef} aria-label="Main">
      <ul className="container-page flex items-center justify-center gap-1 xl:gap-3">
        {items.map((item, index) => {
          if (!isNavGroup(item)) {
            const current = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={current ? "page" : undefined}
                  className={cx(itemClass, current && activeClass)}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const isOpen = open === index;
          const panelId = `${baseId}-panel-${index}`;
          const groupActive = item.items.some((link) => link.href === pathname);
          return (
            <li
              key={item.label}
              className="relative"
              onPointerEnter={(e) => e.pointerType === "mouse" && hover(index, HOVER_OPEN_MS)}
              onPointerLeave={(e) =>
                e.pointerType === "mouse" && isOpen && hover(null, HOVER_CLOSE_MS)
              }
              onBlur={(e) => {
                if (isOpen && !e.currentTarget.contains(e.relatedTarget)) setOpen(null);
              }}
            >
              <button
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className={cx(itemClass, (isOpen || groupActive) && activeClass)}
              >
                {item.label}
                <ChevronDownIcon
                  className={cx(
                    "size-4 transition-transform duration-300 ease-out-soft",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <div
                id={panelId}
                className={cx(
                  "absolute top-full left-0 z-10 w-max max-w-80 min-w-60 pt-px transition-[opacity,translate,visibility] duration-200 ease-out-soft",
                  isOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0",
                )}
              >
                <ul className="rounded-b-md border border-t-2 border-line-soft border-t-primary bg-white p-2 shadow-lg">
                  {item.items.map((link) => {
                    const current = pathname === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          prefetch={false}
                          aria-current={current ? "page" : undefined}
                          onClick={() => setOpen(null)}
                          className={cx(
                            "block rounded-sm px-3.5 py-2.5 text-small text-copy transition-colors duration-150 hover:bg-surface hover:text-primary-strong",
                            current && "bg-surface font-medium text-primary-strong",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
