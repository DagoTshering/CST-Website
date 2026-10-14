"use client";

import { useEffect, useRef, useState } from "react";

import { contact, mainNav } from "@/content/site";
import { Icon } from "@/components/ui/Icon";

/** Mobile/tablet navigation drawer. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const openButton = openButtonRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      openButton?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={openButtonRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-card border border-border text-2xl text-navy"
      >
        <Icon name="menu" />
      </button>

      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="fixed inset-0 z-50 overflow-y-auto bg-navy text-white"
      >
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-display text-sm font-semibold tracking-wide">Menu</span>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="grid size-11 place-items-center rounded-card border border-border-on-navy text-2xl"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label="Main" className="px-5 pb-10 sm:px-8">
          <ul className="divide-y divide-border-on-navy border-y border-border-on-navy">
            {mainNav.map((item) =>
              item.children ? (
                <li key={item.label} className="py-4">
                  <p className="font-display text-xl font-semibold">{item.label}</p>
                  <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <a
                          href={child.href}
                          onClick={close}
                          className="block py-1.5 text-on-navy-muted transition-colors hover:text-brand"
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={close}
                    className="flex items-center justify-between py-4 font-display text-xl font-semibold transition-colors hover:text-brand"
                  >
                    {item.label}
                    <Icon name="arrow" className="text-base text-brand" />
                  </a>
                </li>
              ),
            )}
          </ul>

          <ul className="mt-8 grid gap-3 text-sm text-on-navy-muted">
            <li className="flex items-center gap-3">
              <Icon name="pin" className="text-brand" />
              {contact.location}
            </li>
            <li>
              <a href={contact.phoneHref} className="flex items-center gap-3 hover:text-white">
                <Icon name="phone" className="text-brand" />
                {contact.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 hover:text-white"
              >
                <Icon name="mail" className="text-brand" />
                {contact.email}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
