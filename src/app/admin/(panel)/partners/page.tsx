import { Handshake, ListOrdered, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, ListNotice, TitleWithThumb } from "@/components/admin/DataTable";
import {
  buttonClass,
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { countPartners, listPartners, PARTNER_CATEGORIES } from "@/lib/cms/resources/partners";
import { cx } from "@/lib/cx";

import { deletePartner } from "./actions";

export const metadata: Metadata = { title: "Partners" };

export default async function Page({ searchParams }: PageProps<"/admin/partners">) {
  const params = await searchParams;
  const notice = params.notice;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const selected = PARTNER_CATEGORIES.find((c) => c.value === params.category) ?? null;

  const [rows, total] = await Promise.all([
    listPartners({ category: selected?.value, query }),
    countPartners(),
  ]);
  const filterHref = (category: string | null) => {
    const search = new URLSearchParams();
    if (category) search.set("category", category);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/admin/partners?${qs}` : "/admin/partners";
  };

  const addButton = (
    <LinkButton href={`/admin/partners/new${selected ? `?category=${selected.value}` : ""}`}>
      <Plus aria-hidden="true" />
      Add partner
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Partners"
        description={`Universities, agencies, companies and foundations on the Partners page: international ones by country, national ones by type. ${total} in all.`}
        actions={
          <>
            {total > 1 && (
              <LinkButton
                href={`/admin/partners/arrange${selected ? `?category=${selected.value}` : ""}`}
                variant="secondary"
              >
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {total > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="partner" />

      {total > 0 && (
        <div className="mb-5 space-y-3">
          <form action="/admin/partners" role="search" className="flex max-w-md gap-2">
            {selected && <input type="hidden" name="category" value={selected.value} />}
            <label htmlFor="partner-search" className="sr-only">
              Search partners
            </label>
            <input
              id="partner-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Name, city or country"
              className="block w-full rounded-md border border-admin-line bg-white px-3.5 py-2 text-sm text-admin-navy shadow-xs focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/20 focus:outline-none"
            />
            <button type="submit" className={buttonClass("secondary")}>
              <Search aria-hidden="true" />
              Search
            </button>
          </form>
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
            {[{ value: null, label: "All partners" }, ...PARTNER_CATEGORIES].map((c) => {
              const active = selected ? c.value === selected.value : c.value === null;
              return (
                <Link
                  key={c.value ?? "all"}
                  href={filterHref(c.value)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-admin-navy bg-admin-navy text-white"
                      : "border-admin-line bg-white text-admin-navy hover:border-admin-accent",
                  )}
                >
                  {c.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title={total > 0 ? "No partners match" : "No partners yet"}
            action={addButton}
          >
            {total > 0
              ? "Try another search or category."
              : "Add a partner to list it on the Partners page."}
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Partners"
          rows={rows}
          kind="partner"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/partners/${row.id}`}
          deleteAction={(row) => deletePartner.bind(null, row.id)}
          columns={[
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            { header: "Place", cell: (row) => row.place, wide: true },
            {
              header: "Type",
              cell: (row) => `${row.categoryLabel} · ${row.typeLabel}`,
              wide: true,
              className: "whitespace-nowrap",
            },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            {
              header: "Last updated",
              cell: (row) => formatDateTime(row.updatedAt),
              wide: true,
              className: "whitespace-nowrap text-admin-muted",
            },
          ]}
        />
      )}
    </>
  );
}
