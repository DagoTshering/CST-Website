import type { CSSProperties } from "react";

import { DocumentIcon, DownloadIcon, ExternalIcon } from "@/components/ui/icons";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedDownloads, type PublicDownload } from "@/lib/cms/resources/downloads";
import { formatDate } from "@/lib/dates";

import { DownloadsFilter } from "./DownloadsFilter";

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

const size = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

/** Where a link goes, in a few words. */
function linkLabel(href: string) {
  try {
    const url = new URL(href);
    if (url.hostname === "drive.google.com" && url.pathname.includes("/folders/")) {
      return "Google Drive folder";
    }
    if (url.hostname.endsWith("google.com")) return "Google Drive";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

const searchText = (item: PublicDownload, category: string) =>
  [item.title, item.group, item.description, category].filter(Boolean).join(" ").toLowerCase();

/** One download: the title and details, then a Download (or Open) button. */
function Row({
  item,
  number,
  category,
}: {
  item: PublicDownload;
  number: number;
  category: string;
}) {
  const isFile = item.kind === "file";
  return (
    <li
      data-download={searchText(item, category)}
      className="grid grid-cols-[2.25rem_1fr] gap-x-3 gap-y-3 border-b border-line py-4 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:py-5"
    >
      <span className="pt-1 font-mono text-xs text-muted sm:pt-0">
        {String(number).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[1.0625rem] leading-snug font-semibold text-ink">
          {item.title}
        </p>
        {(item.description || item.publishedOn) && (
          <p className="mt-1 text-small text-copy">
            {item.publishedOn && (
              <time dateTime={item.publishedOn} className="font-mono text-xs text-muted">
                {formatDate(item.publishedOn)}
              </time>
            )}
            {item.publishedOn && item.description && " · "}
            {item.description}
          </p>
        )}
      </div>
      <a
        href={item.href}
        {...(isFile ? { download: "" } : { target: "_blank", rel: "noopener noreferrer" })}
        className="group col-start-2 inline-flex items-center justify-self-start rounded-sm border border-line bg-white text-small font-semibold text-ink shadow-xs transition-colors hover:border-primary-strong hover:text-primary-strong sm:col-start-3 sm:justify-self-end"
      >
        <span className="flex items-center gap-2 border-r border-line px-3 py-2 font-mono text-[11px] font-normal tracking-[0.06em] text-muted uppercase group-hover:border-primary-strong/40">
          {isFile ? <DocumentIcon className="size-4" /> : <ExternalIcon className="size-4" />}
          {isFile ? `PDF${item.byteSize ? ` · ${size(item.byteSize)}` : ""}` : linkLabel(item.href)}
        </span>
        <span className="flex items-center gap-2 px-3 py-2">
          {isFile ? "Download" : "Open"}
          {isFile ? (
            <DownloadIcon className="size-4 transition-transform group-hover:translate-y-0.5" />
          ) : (
            <ExternalIcon className="size-4" />
          )}
        </span>
        <span className="sr-only">
          {isFile ? `${item.title} (PDF)` : `${item.title} (opens in a new tab)`}
        </span>
      </a>
    </li>
  );
}

/**
 * Links with short titles in a group (the project reports' years) as a row of tiles, rather than
 * one full row each.
 */
function Tiles({ items, category }: { items: PublicDownload[]; category: string }) {
  return (
    <ul className="flex flex-wrap gap-2 py-4">
      {items.map((item) => (
        <li key={item.id} data-download={searchText(item, category)}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-white px-3 py-1.5 font-mono text-xs tracking-[0.04em] text-ink shadow-xs transition-colors hover:border-primary-strong hover:text-primary-strong"
          >
            {item.title}
            <ExternalIcon className="size-3.5 text-muted" />
            <span className="sr-only">
              , {item.group}, {linkLabel(item.href)} (opens in a new tab)
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The items of a category, under their group headings where they have them. */
function Items({ items, category }: { items: PublicDownload[]; category: string }) {
  const groups: { name: string | null; items: PublicDownload[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.name === item.group) last.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  let number = 0;
  return groups.map((group, g) => {
    const tiles = group.items.every((i) => i.kind === "link" && i.title.length <= 12);
    const list = tiles ? (
      <Tiles items={group.items} category={category} />
    ) : (
      <ol>
        {group.items.map((item) => (
          <Row key={item.id} item={item} number={++number} category={category} />
        ))}
      </ol>
    );
    return group.name ? (
      <div key={`${group.name}-${g}`} data-download-group className="border-b border-line">
        <h3 className="eyebrow pt-5 text-ink">{group.name}</h3>
        {list}
      </div>
    ) : (
      <div key={`ungrouped-${g}`} data-download-group>
        {list}
      </div>
    );
  });
}

/**
 * The published downloads by category, with an index of the categories beside them (above them
 * on a phone) and a search box. Reads the database at request time through a cached query.
 */
export async function DownloadsList() {
  const result = await loadPublished("downloads", getPublishedDownloads);

  if (!result.ok) {
    return (
      <p className="container-page section-y text-copy">
        The downloads cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  const categories = result.data;
  if (categories.length === 0) {
    return (
      <p className="container-page section-y text-copy">There are no downloads at the moment.</p>
    );
  }

  return (
    <div className="container-page grid gap-10 pt-10 pb-24 lg:grid-cols-12 lg:gap-16 lg:pt-14">
      <aside className="lg:col-span-3">
        <div className="lg:sticky lg:top-[calc(var(--header-bar-h)+2rem)]">
          <DownloadsFilter />
          <nav aria-label="Categories" className="mt-6">
            <p className="eyebrow text-muted">Categories</p>
            <ol className="mt-3 border-t border-ink">
              {categories.map((category, i) => (
                <li key={category.id} className="border-b border-line">
                  <a
                    href={`#category-${category.id}`}
                    className="group flex items-baseline gap-3 py-2.5 text-small text-ink transition-colors hover:text-primary-strong"
                  >
                    <span className="font-mono text-[11px] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{category.name}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {category.items.length}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </aside>

      <div id="downloads-list" className="lg:col-span-9">
        <p data-downloads-empty hidden className="border-y border-line py-6 text-copy">
          No downloads match your search.
        </p>
        {categories.map((category, i) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            aria-labelledby={`category-${category.id}-title`}
            data-download-section
            className="mb-14 scroll-mt-[calc(var(--header-bar-h)+1.5rem)] last:mb-0"
          >
            <div
              data-reveal
              suppressHydrationWarning
              style={delay(60)}
              className="flex items-baseline gap-4 border-b border-ink pb-3"
            >
              <span className="font-mono text-xs text-brass-deep">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2
                id={`category-${category.id}-title`}
                className="flex-1 font-serif text-[clamp(1.5rem,1.25rem+0.9vw,2rem)] leading-tight font-semibold text-ink"
              >
                {category.name}
              </h2>
              <span className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase">
                {category.items.length} {category.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            {category.description && (
              <p className="mt-3 max-w-2xl text-small text-copy">{category.description}</p>
            )}
            <Items items={category.items} category={category.name} />
          </section>
        ))}
      </div>
    </div>
  );
}

/** Shown while the list loads. */
export function DownloadsListSkeleton() {
  return (
    <div
      aria-busy="true"
      className="container-page grid gap-10 pt-10 pb-24 lg:grid-cols-12 lg:gap-16 lg:pt-14"
    >
      <span className="sr-only">Loading downloads…</span>
      <div className="hidden lg:col-span-3 lg:block">
        <div className="h-64 animate-pulse bg-line-soft" />
      </div>
      <div className="space-y-4 lg:col-span-9">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse bg-line-soft" />
        ))}
      </div>
    </div>
  );
}
