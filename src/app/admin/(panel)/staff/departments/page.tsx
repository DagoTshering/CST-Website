import { Building, Plus, ListOrdered } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { Card, EmptyState, formatDateTime, LinkButton, PageHeader } from "@/components/admin/ui";
import { listDepartments } from "@/lib/cms/resources/staff";

import { deleteDepartment } from "../actions";

export const metadata: Metadata = { title: "Departments" };

export default async function Page({ searchParams }: PageProps<"/admin/staff/departments">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listDepartments()]);
  const addButton = (
    <LinkButton href="/admin/staff/departments/new">
      <Plus aria-hidden="true" />
      Add department
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Departments"
        description="Academic departments and administrative units, in the order the Staff Directory lists them. A department can be deleted once it has no staff."
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton href="/admin/staff/departments/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {rows.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="department" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Building} title="No departments yet" action={addButton}>
            Create a department, then add its staff.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Departments"
          rows={rows}
          kind="department"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/staff/departments/${row.id}`}
          deleteAction={(row) => deleteDepartment.bind(null, row.id)}
          columns={[
            { header: "Name", cell: (row) => row.name },
            { header: "Code", cell: (row) => row.code, wide: true },
            {
              header: "Type",
              cell: (row) => (row.kind === "administration" ? "Administrative" : "Academic"),
              wide: true,
            },
            { header: "Staff", cell: (row) => row.staff },
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
