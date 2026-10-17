"use client";

import { useDeferredValue, useId, useState } from "react";

import {
  matchesQuery,
  type Department,
  type DepartmentKey,
  type StaffMember,
} from "@/content/staff";

import { StaffCarousel } from "./StaffCarousel";
import { StaffDetails } from "./StaffDetails";
import s from "./StaffDirectory.module.css";
import { StaffPhoto } from "./StaffPhoto";

type StaffDirectoryProps = {
  staff: StaffMember[];
  departments: Department[];
};

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

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

/** A person in the search results: portrait, then the same details as the carousel's card. */
function ResultCard({ person }: { person: StaffMember }) {
  return (
    <li className={s.result}>
      <StaffPhoto
        person={person}
        sizes="(max-width: 539px) 104px, (max-width: 1119px) 45vw, 300px"
        className={s.resultPhoto}
      />
      <div className={s.resultText}>
        <h3 className={s.resultName}>{person.name}</h3>
        <StaffDetails person={person} layout="stacked" className={s.resultDetails} />
      </div>
    </li>
  );
}

/**
 * The directory below the page title: a search box and department filters, then either one
 * section per department, each a carousel of its people, or (while searching) one grid of every
 * match. The department filter narrows a search as well.
 */
export function StaffDirectory({ staff, departments }: StaffDirectoryProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<DepartmentKey | "all">("all");
  const searchId = useId();
  const search = useDeferredValue(query).trim();

  const inActive = (person: StaffMember) => active === "all" || person.department === active;
  const results = search ? staff.filter((p) => inActive(p) && matchesQuery(p, search)) : [];
  const activeLabel = departments.find((d) => d.key === active)?.label;

  const filters = [
    { key: "all" as const, label: "All", count: staff.length },
    ...departments.map((d) => ({
      key: d.key,
      label: d.label,
      count: staff.filter((p) => p.department === d.key).length,
    })),
  ];

  return (
    <div className={`container-page ${s.directory}`}>
      <div className={s.controls}>
        <div className={s.search}>
          <label htmlFor={searchId} className="sr-only">
            Search staff
          </label>
          <SearchIcon />
          <input
            id={searchId}
            type="search"
            className={s.input}
            placeholder="Search by name, designation or email…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={s.filters} role="group" aria-label="Filter by department">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={s.filter}
              aria-pressed={active === filter.key}
              onClick={() => setActive(filter.key)}
            >
              {/* the bold label, unseen, holds the width so the row does not shift */}
              <span className={s.filterLabel} data-label={filter.label}>
                {filter.label}
              </span>
              <span className={s.filterCount}>
                <span className="sr-only">, </span>
                {filter.count}
                <span className="sr-only"> {filter.count === 1 ? "person" : "people"}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* the result count, or that nothing matched; read out as it changes */}
      <p role="status" className={!search ? "sr-only" : results.length ? s.summary : s.empty}>
        {!search
          ? ""
          : results.length
            ? `${results.length} ${results.length === 1 ? "result" : "results"}${activeLabel ? ` in ${activeLabel}` : ""}`
            : `No one matches “${search}”${activeLabel ? ` in ${activeLabel}` : ""}. Try a shorter name or another department.`}
      </p>

      {search
        ? results.length > 0 && (
            <ul className={s.grid}>
              {results.map((person) => (
                <ResultCard key={person.id} person={person} />
              ))}
            </ul>
          )
        : departments
            .filter((d) => active === "all" || d.key === active)
            .map((department) => {
              const members = staff.filter((p) => p.department === department.key);
              const titleId = `dept-${department.key.toLowerCase()}-title`;
              return (
                <section
                  key={department.key}
                  id={`dept-${department.key.toLowerCase()}`}
                  aria-labelledby={titleId}
                  className={s.section}
                >
                  <div data-reveal suppressHydrationWarning className={s.sectionHead}>
                    <h2 id={titleId} className={s.sectionTitle}>
                      {department.label}
                    </h2>
                    <span className={s.sectionCount}>{people(members.length)}</span>
                  </div>
                  <StaffCarousel people={members} label={department.label} />
                </section>
              );
            })}
    </div>
  );
}
