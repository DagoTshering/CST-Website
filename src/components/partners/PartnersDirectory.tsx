"use client";

import { useId, useState } from "react";

import { OrnateFrame } from "@/components/ui/OrnateFrame";
import { ExternalIcon } from "@/components/ui/icons";
import { InteractiveAccordion } from "@/components/ui/InteractiveAccordion";
import t from "@/components/ui/Tabs.module.css";
import {
  groupPartners,
  matchesPartner,
  partnersLabel,
  type Partner,
  type PartnerCategory,
  type PartnerGroup,
} from "@/content/partners";

import { PartnerLogo } from "./PartnerLogo";
import s from "./Partners.module.css";

const TABS: { category: PartnerCategory; label: string; short: string }[] = [
  { category: "international", label: "International partners", short: "International" },
  { category: "national", label: "National partners", short: "National" },
];

/** An accordion item's id: the tab, then the group (a country, or a type). */
const itemId = (category: PartnerCategory, group: PartnerGroup) => `${category}-${group.id}`;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={s.searchIcon}>
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m16 16 4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A partner in an open group, framed by the Bhutanese corners; a link to their website if set. */
function PartnerCard({ partner }: { partner: Partner }) {
  const place = [partner.city, partner.note].filter(Boolean).join(" · ");
  const body = (
    <OrnateFrame size={46} compact className={s.frame}>
      <span className={s.cardBody}>
        <PartnerLogo partner={partner} />
        <span className={s.cardText}>
          <span className={s.cardName}>{partner.name}</span>
          {place && <span className={s.cardPlace}>{place}</span>}
        </span>
        {partner.websiteUrl && <ExternalIcon className={s.cardExternal} aria-hidden="true" />}
      </span>
    </OrnateFrame>
  );
  return partner.websiteUrl ? (
    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className={s.card}>
      {body}
      <span className="sr-only"> (website, opens in a new tab)</span>
    </a>
  ) : (
    <div className={s.card}>{body}</div>
  );
}

/**
 * Below the figures: the two tabs (international partners by country, national ones by type), a
 * search box and "Expand all", then the chosen tab's groups as an accordion, each opening onto a
 * grid of cards. A search narrows both tabs and opens every group with a match.
 */
export function PartnersDirectory({ partners }: { partners: Partner[] }) {
  const [tab, setTab] = useState<PartnerCategory>("international");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const searchId = useId();
  const search = query.trim();

  // each tab's groups, holding only the partners that match the search
  const groupsOf = (category: PartnerCategory, text: string) =>
    groupPartners(partners, category)
      .map((group) => ({
        ...group,
        partners: text
          ? group.partners.filter((p) => matchesPartner(p, text, group.title))
          : group.partners,
      }))
      .filter((group) => group.partners.length > 0);
  const tabs = TABS.map((entry) => ({ ...entry, groups: groupsOf(entry.category, search) }));
  const count = (groups: PartnerGroup[]) => groups.reduce((n, g) => n + g.partners.length, 0);
  const current = tabs.find((entry) => entry.category === tab)!;
  const other = tabs.find((entry) => entry.category !== tab)!;
  const currentIds = current.groups.map((group) => itemId(tab, group));
  const allOpen = currentIds.length > 0 && currentIds.every((id) => open.includes(id));

  const onSearch = (value: string) => {
    setQuery(value);
    const text = value.trim();
    // a search opens every group with a match, in both tabs; clearing it closes them again
    setOpen(
      text
        ? TABS.flatMap(({ category }) =>
            groupsOf(category, text).map((group) => itemId(category, group)),
          )
        : [],
    );
  };
  const toggle = (id: string) =>
    setOpen((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));
  const toggleAll = () =>
    setOpen((ids) =>
      allOpen
        ? ids.filter((id) => !currentIds.includes(id))
        : [...ids.filter((id) => !currentIds.includes(id)), ...currentIds],
    );

  return (
    <div className={s.directory}>
      <div className={s.toolbar}>
        <div className={`${t.tabs} ${s.tabs}`} role="group" aria-label="Show partners">
          {tabs.map((entry) => (
            <button
              key={entry.category}
              type="button"
              className={t.tab}
              aria-pressed={entry.category === tab}
              onClick={() => setTab(entry.category)}
            >
              {/* "partners" goes on phones, so the two tabs share a line */}
              <span>
                {entry.short}
                <span className={s.tabWord}> partners</span>
              </span>
              <span className={t.count}>
                <span className="sr-only">, </span>
                {count(entry.groups)}
              </span>
            </button>
          ))}
        </div>

        <div className={s.tools}>
          <div className={s.search}>
            <label htmlFor={searchId} className="sr-only">
              Search partners
            </label>
            <SearchIcon />
            <input
              id={searchId}
              type="search"
              className={s.input}
              placeholder="Search by name, city, country or type…"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
          {current.groups.length > 0 && (
            <button type="button" className={s.expand} onClick={toggleAll}>
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          )}
        </div>
      </div>

      {/* the number of matches, or that there are none; read out as it changes */}
      <p role="status" className={search ? s.summary : "sr-only"}>
        {!search
          ? ""
          : current.groups.length
            ? `${partnersLabel(count(current.groups))} in ${current.groups.length} ${current.groups.length === 1 ? "group" : "groups"} match “${search}”.`
            : `No ${current.label.toLowerCase()} match “${search}”.${count(other.groups) ? ` ${count(other.groups)} ${other.label.toLowerCase()} do.` : " Try a shorter name, a city or a country."}`}
        {search && current.groups.length === 0 && count(other.groups) > 0 && (
          <>
            {" "}
            <button type="button" className={s.switch} onClick={() => setTab(other.category)}>
              Show them
            </button>
          </>
        )}
      </p>

      <h2 className="sr-only">{current.label}</h2>
      {current.groups.length > 0 && (
        <div className={s.groups}>
          <InteractiveAccordion
            key={tab}
            wide
            open={open}
            onToggle={toggle}
            items={current.groups.map((group) => ({
              id: itemId(tab, group),
              title: group.title,
              subtitle: partnersLabel(group.partners.length),
              aside: (
                <span className={s.preview}>
                  {group.partners.slice(0, 4).map((partner) => (
                    <PartnerLogo key={partner.id} partner={partner} small />
                  ))}
                </span>
              ),
              content: (
                <ul className={s.grid}>
                  {group.partners.map((partner) => (
                    <li key={partner.id}>
                      <PartnerCard partner={partner} />
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </div>
      )}
    </div>
  );
}
