/**
 * The page links to show for page `current` of `total`: the first and last pages, the current
 * page and its neighbours, and "gap" (shown as "…") for the pages skipped in between. A gap that
 * would hide a single page shows that page instead, so "…" always stands for two or more.
 *
 *   pageLinks(1, 15) -> [1, 2, "gap", 15]
 *   pageLinks(7, 15) -> [1, "gap", 6, 7, 8, "gap", 15]
 *   pageLinks(3, 5)  -> [1, 2, 3, 4, 5]
 */
export function pageLinks(current: number, total: number, neighbours = 1): (number | "gap")[] {
  if (total <= 1) return [1];
  const shown = new Set([1, total]);
  for (let n = current - neighbours; n <= current + neighbours; n++) {
    if (n >= 1 && n <= total) shown.add(n);
  }
  const pages = [...shown].sort((a, b) => a - b);
  const links: (number | "gap")[] = [];
  pages.forEach((page, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined) {
      if (page - previous === 2) links.push(previous + 1);
      else if (page - previous > 2) links.push("gap");
    }
    links.push(page);
  });
  return links;
}
