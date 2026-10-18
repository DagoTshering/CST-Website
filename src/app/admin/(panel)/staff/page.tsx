import { BadgeCheck, Building, Plus, Search, Users, ListOrdered } from "lucide-react";
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
import { countStaff, listDepartmentOptions, listStaff } from "@/lib/cms/resources/staff";
import { cx } from "@/lib/cx";

import { deleteStaff } from "./actions";

export const metadata: Metadata = { title: "Staff Directory" };

export default async function Page({ searchParams }: PageProps<"/admin/staff">) {
  const params = await searchParams;
  const notice = params.notice;
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const department = typeof params.department === "string" ? Number(params.department) : NaN;

  const departments = await listDepartmentOptions();
  const selected = departments.find((d) => d.id === department) ?? null;
  const [rows, total] = await Promise.all([
    listStaff({ departmentId: selected?.id, query }),
    countStaff(),
  ]);
  const filterHref = (id: number | null) => {
    const search = new URLSearchParams();
    if (id) search.set("department", String(id));
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/admin/staff?${qs}` : "/admin/staff";
  };

  const addButton = (
    <LinkButton href="/admin/staff/new">
      <Plus aria-hidden="true" />
      Add staff member
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Staff Directory"
        description={`Academic and support staff, shown by department on the Staff Directory page. ${total} in all.`}
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton
                href={`/admin/staff/arrange${selected ? `?department=${selected.id}` : ""}`}
                variant="secondary"
              >
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/staff/designations" variant="secondary">
              <BadgeCheck aria-hidden="true" />
              Designations
            </LinkButton>
            <LinkButton href="/admin/staff/departments" variant="secondary">
              <Building aria-hidden="true" />
              Departments
            </LinkButton>
            {departments.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="staff member" />

      {departments.length > 0 && (
        <div className="mb-5 space-y-3">
          <form action="/admin/staff" role="search" className="flex max-w-md gap-2">
            {selected && <input type="hidden" name="department" value={selected.id} />}
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <input
              id="staff-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Name, designation or email"
              className="block w-full rounded-md border border-admin-line bg-white px-3.5 py-2 text-sm text-admin-navy shadow-xs focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/20 focus:outline-none"
            />
            <button type="submit" className={buttonClass("secondary")}>
              <Search aria-hidden="true" />
              Search
            </button>
          </form>
          <nav aria-label="Filter by department" className="flex flex-wrap gap-2">
            {[{ id: null, name: "All departments" }, ...departments].map((d) => {
              const active = selected ? d.id === selected.id : d.id === null;
              return (
                <Link
                  key={d.id ?? "all"}
                  href={filterHref(d.id)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-admin-navy bg-admin-navy text-white"
                      : "border-admin-line bg-white text-admin-navy hover:border-admin-accent",
                  )}
                >
                  {d.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {departments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building}
            title="No departments yet"
            action={
              <LinkButton href="/admin/staff/departments/new">
                <Plus aria-hidden="true" />
                Add department
              </LinkButton>
            }
          >
            Staff are listed by department. Create a department first.
          </EmptyState>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={query || selected ? "No staff match" : "No staff yet"}
            action={addButton}
          >
            {query || selected
              ? "Try another search or department."
              : "Add a staff member to list them in the directory."}
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Staff"
          rows={rows}
          kind="staff member"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/staff/${row.id}`}
          deleteAction={(row) => deleteStaff.bind(null, row.id)}
          columns={[
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            { header: "Designation", cell: (row) => row.designation, wide: true },
            { header: "Department", cell: (row) => row.department, wide: true },
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
