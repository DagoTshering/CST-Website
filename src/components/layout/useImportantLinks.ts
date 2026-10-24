"use client";

import { useEffect, useState } from "react";

import { IMPORTANT_LINKS, isNavGroup, type NavItem, type NavLink } from "@/content/site";

/*
 * The "Important Links" under "Others" are managed in the admin panel. The menu is part of every
 * page, including pages prerendered whole at build time (when there is no database), so the
 * links are loaded here in the browser, from /api/important-links, once per visit. Until they
 * arrive (or if there are none) the submenu simply has no Important Links group.
 */

let pending: Promise<NavLink[]> | null = null;

// Only web addresses and paths of this site, whatever the response holds.
const isSafeHref = (href: unknown): href is string =>
  typeof href === "string" && /^(https?:\/\/|\/(?!\/))/.test(href);

function loadLinks() {
  pending ??= fetch("/api/important-links")
    .then((response) => (response.ok ? response.json() : { links: [] }))
    .then(({ links }: { links?: unknown }) =>
      (Array.isArray(links) ? links : [])
        .filter(
          (link): link is NavLink =>
            typeof link?.label === "string" && link.label !== "" && isSafeHref(link.href),
        )
        .map(({ label, href }) => ({ label, href })),
    )
    .catch(() => {
      pending = null; // try again on the next menu that mounts
      return [];
    });
  return pending;
}

/** The menu's items with the Important Links filled in, and left out while there are none. */
export function useImportantLinks(items: NavItem[]): NavItem[] {
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    let active = true;
    loadLinks().then((loaded) => active && setLinks(loaded));
    return () => {
      active = false;
    };
  }, []);

  return items.map((item) =>
    isNavGroup(item)
      ? {
          ...item,
          items: item.items.flatMap((entry) => {
            if (!isNavGroup(entry) || entry.label !== IMPORTANT_LINKS) return [entry];
            return links.length > 0 ? [{ ...entry, items: links }] : [];
          }),
        }
      : item,
  );
}
