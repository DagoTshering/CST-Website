"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import {
  ChevronDownIcon,
  CloseIcon,
  MailIcon,
  MapPinIcon,
  MenuIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { headerAction, isNavGroup, site, type NavItem, type NavLink } from "@/content/site";
import { cx } from "@/lib/cx";

import { useImportantLinks } from "./useImportantLinks";

const DESKTOP_QUERY = "(min-width: 80rem)"; // where DesktopNav takes over (Tailwind xl)

/**
 * The menu for phones and tablets: a button that opens the navigation in a modal side panel.
 * The native <dialog> keeps focus inside the panel, closes on Escape and gives focus back to
 * the button. Items without a page of their own expand in place, with any titled subgroup
 * ("Important Links" under "Others") listed under its own small heading.
 */
export function MobileMenu({ items: nav }: { items: NavItem[] }) {
  const items = useImportantLinks(nav);
  const pathname = usePathname();
  const baseId = useId();
  const dialogId = `${baseId}-dialog`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const open = () => {
    dialogRef.current?.showModal();
    setIsOpen(true);
  };
  const close = () => dialogRef.current?.close();

  // The panel has no place on a desktop layout, so close it if the window grows past the breakpoint.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) dialogRef.current?.close();
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const { contact } = site;
  const subLink = (link: NavLink) => (
    <li key={link.href} className="pb-1">
      <SmartLink
        href={link.href}
        aria-current={pathname === link.href ? "page" : undefined}
        onClick={close}
        className="flex min-h-11 items-center border-l-2 border-line pl-4 text-body text-copy transition-colors hover:border-primary hover:text-primary-strong"
      >
        {link.label}
      </SmartLink>
    </li>
  );
  const linkClass =
    "flex min-h-14 w-full items-center justify-between gap-4 font-display text-lg font-medium text-ink transition-colors hover:text-primary-strong";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        className="grid size-11 place-items-center rounded-full border border-line text-ink transition-colors hover:border-primary hover:bg-accent-soft xl:hidden"
      >
        <MenuIcon className="size-5" />
        <span className="sr-only">Open menu</span>
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-label="Menu"
        onClose={() => {
          setIsOpen(false);
          setExpanded(null);
        }}
        // A click on the backdrop lands on the <dialog> itself; clicks inside land on the panel.
        onClick={(event) => event.target === event.currentTarget && close()}
        className={cx(
          "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-sm bg-white p-0 text-copy shadow-lg",
          "translate-x-full transition-[translate,display,overlay] duration-300 ease-out-soft transition-discrete open:translate-x-0 starting:open:translate-x-full",
          "backdrop:bg-ink/45 backdrop:opacity-0 backdrop:backdrop-blur-[2px] backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-300 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-soft px-5 sm:h-18">
            <span className="font-display text-h4 font-semibold text-ink">Menu</span>
            <button
              type="button"
              onClick={close}
              className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface"
            >
              <CloseIcon className="size-5" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            <ul className="divide-y divide-line-soft">
              {items.map((item, index) => {
                if (!isNavGroup(item)) {
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        aria-current={pathname === item.href ? "page" : undefined}
                        onClick={close}
                        className={cx(linkClass, pathname === item.href && "text-primary-strong")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                const isExpanded = expanded === index;
                const groupId = `${baseId}-group-${index}`;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={groupId}
                      onClick={() => setExpanded(isExpanded ? null : index)}
                      className={linkClass}
                    >
                      {item.label}
                      <ChevronDownIcon
                        className={cx(
                          "size-5 text-muted transition-transform duration-300 ease-out-soft",
                          isExpanded && "rotate-180 text-primary-strong",
                        )}
                      />
                    </button>
                    {/* Grid rows animate the height; inert keeps the collapsed links out of the tab order. */}
                    <div
                      id={groupId}
                      inert={!isExpanded}
                      className={cx(
                        "grid transition-[grid-template-rows] duration-300 ease-out-soft",
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <ul className="pb-3">
                          {item.items.map((link, linkIndex) => {
                            if (!isNavGroup(link)) return subLink(link);
                            const headingId = `${groupId}-sub-${linkIndex}`;
                            return (
                              <li key={link.label} className="pt-3">
                                <p
                                  id={headingId}
                                  className="pb-2 font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase"
                                >
                                  {link.label}
                                </p>
                                <ul aria-labelledby={headingId}>{link.items.map(subLink)}</ul>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0 border-t border-line-soft px-5 py-4">
            <Link
              href={headerAction.href}
              prefetch={false}
              onClick={close}
              className="flex min-h-12 w-full items-center justify-center rounded-sm bg-primary-strong px-6 font-display text-[0.9375rem] font-semibold text-white transition-colors hover:bg-primary-deep"
            >
              {headerAction.label}
            </Link>
          </div>

          <address className="shrink-0 space-y-3 bg-surface px-5 py-5 text-small not-italic">
            <p className="flex items-center gap-3">
              <MapPinIcon className="size-4.5 shrink-0 text-primary-strong" />
              {contact.location}
            </p>
            <a
              href={contact.phone.href}
              className="flex items-center gap-3 transition-colors hover:text-primary-strong"
            >
              <PhoneIcon className="size-4.5 shrink-0 text-primary-strong" />
              {contact.phone.label}
            </a>
            <a
              href={contact.email.href}
              className="flex items-center gap-3 transition-colors hover:text-primary-strong"
            >
              <MailIcon className="size-4.5 shrink-0 text-primary-strong" />
              {contact.email.label}
            </a>
          </address>
        </div>
      </dialog>
    </>
  );
}
