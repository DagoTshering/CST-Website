"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { SearchIcon } from "@/components/ui/icons";

const noSubscription = () => () => {};

/**
 * Filters the Downloads page as the visitor types, by hiding the rows (marked [data-download])
 * that do not match, and the groups and categories left empty. The rows are rendered on the
 * server; without JavaScript this box stays hidden and every download is shown.
 */
export function DownloadsFilter() {
  // false on the server, true once running in the browser
  const ready = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    const list = document.getElementById("downloads-list");
    if (!list) return;
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);

    let shown = 0;
    for (const row of list.querySelectorAll<HTMLElement>("[data-download]")) {
      const text = row.dataset.download ?? "";
      const match = words.every((word) => text.includes(word));
      row.hidden = !match;
      if (match) shown++;
    }
    for (const box of list.querySelectorAll<HTMLElement>(
      "[data-download-group], [data-download-section]",
    )) {
      box.hidden = !box.querySelector("[data-download]:not([hidden])");
    }
    const empty = list.querySelector<HTMLElement>("[data-downloads-empty]");
    if (empty) empty.hidden = shown > 0;
  }, [query]);

  return (
    <div hidden={!ready}>
      <label htmlFor="downloads-search" className="eyebrow text-muted">
        Search downloads
      </label>
      <div className="relative mt-3">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          id="downloads-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. leave form"
          autoComplete="off"
          className="block w-full rounded-sm border border-line bg-white py-2.5 pr-3 pl-9 text-small text-ink shadow-xs placeholder:text-muted/70 focus:border-primary-strong focus:outline-none"
        />
      </div>
    </div>
  );
}
