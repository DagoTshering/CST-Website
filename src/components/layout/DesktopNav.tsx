"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { isNavGroup, type NavItem, type NavLink } from "@/content/site";
import { cx } from "@/lib/cx";

const HOVER_OPEN_MS = 60;
const HOVER_CLOSE_MS = 160;

// A thin underline grows from the left under the label, for hover and for the current page.
const itemClass =
  "relative inline-flex h-full items-center gap-1.5 font-display text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:text-primary-strong " +
  "after:absolute after:inset-x-0 after:bottom-[calc(50%-0.875rem)] after:h-[1.5px] after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-out-soft hover:after:scale-x-100";

const activeClass = "text-primary-strong after:scale-x-100";

/**
 * Desktop menu bar, following the WAI-ARIA disclosure navigation pattern: items without a page
 * are buttons that show their submenu. A submenu opens on click, or on hover with a mouse, and
 * closes on Escape, on a click elsewhere, or when focus leaves it. A submenu with titled
 * subgroups ("Important Links" under "Others") shows them in a second column.
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
    <nav ref={navRef} aria-label="Main" className="hidden h-full xl:block">
      <ul className="flex h-full items-center gap-7">
        {items.map((item, index) => {
          if (!isNavGroup(item)) {
            const current = pathname === item.href;
            return (
              <li key={item.label} className="h-full">
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
          const links = item.items.filter((link): link is NavLink => !isNavGroup(link));
          const subgroups = item.items.filter(isNavGroup);
          const groupActive = [...links, ...subgroups.flatMap((group) => group.items)].some(
            (link) => link.href === pathname,
          );
          // The last menus sit near the right edge, so their panels open leftwards.
          const alignEnd = index >= items.length - 2;
          const renderLink = (link: NavLink) => {
            const current = pathname === link.href;
            return (
              <li key={link.href}>
                <SmartLink
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(null)}
                  className={cx(
                    "block rounded-md px-4 py-3 text-[0.9375rem] leading-snug text-copy transition-colors duration-150 hover:bg-surface hover:text-primary-strong",
                    current && "bg-surface font-medium text-primary-strong",
                  )}
                >
                  {link.label}
                </SmartLink>
              </li>
            );
          };
          return (
            <li
              key={item.label}
              className="relative h-full"
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
                  "absolute top-[calc(100%-0.75rem)] z-10 w-max min-w-64 pt-3 transition-[opacity,translate,visibility] duration-200 ease-out-soft",
                  alignEnd ? "-right-4" : "-left-4",
                  isOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0",
                )}
              >
                <div className="flex rounded-lg bg-white p-2.5 shadow-lg ring-1 ring-ink/5">
                  <ul className="w-max max-w-80">{links.map(renderLink)}</ul>
                  {subgroups.map((group, groupIndex) => {
                    const headingId = `${panelId}-group-${groupIndex}`;
                    return (
                      <div
                        key={group.label}
                        className="ml-2.5 w-56 border-l border-line-soft pl-2.5"
                      >
                        <p
                          id={headingId}
                          className="px-4 pt-3 pb-1.5 font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase"
                        >
                          {group.label}
                        </p>
                        <ul aria-labelledby={headingId}>{group.items.map(renderLink)}</ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
