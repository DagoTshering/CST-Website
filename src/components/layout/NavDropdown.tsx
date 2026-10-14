"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { NavItem } from "@/content/site";
import { Icon } from "@/components/ui/Icon";

/** Desktop dropdown: opens on click, hover or keyboard; closes on Escape or outside click. */
export function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <li
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 items-center gap-1.5 text-sm font-medium text-white/85 transition-colors hover:text-white aria-expanded:text-white"
      >
        {item.label}
        <Icon
          name="chevronDown"
          className={`text-brand transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="absolute top-full left-1/2 z-50 min-w-56 -translate-x-1/2 border-t-2 border-brand bg-white py-2 shadow-lift"
      >
        {item.children?.map((child) => (
          <li key={child.label}>
            <a
              href={child.href}
              onClick={() => setOpen(false)}
              className="block px-5 py-2.5 text-sm text-ink transition-colors hover:bg-surface hover:text-brand-strong"
            >
              {child.label}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}
