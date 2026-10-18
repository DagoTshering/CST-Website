import { BadgeCheck, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { Card, EmptyState, formatDateTime, LinkButton, PageHeader } from "@/components/admin/ui";
import { listDesignations } from "@/lib/cms/resources/staff";

import { deleteDesignation } from "../actions";

export const metadata: Metadata = { title: "Designations" };

export default async function Page({ searchParams }: PageProps<"/admin/staff/designations">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listDesignations()]);
  const addButton = (
    <LinkButton href="/admin/staff/designations/new">
      <Plus aria-hidden="true" />
      Add designation
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Designations"
        description="The positions offered in the staff form’s Designation list, e.g. Lecturer or Sr. Technician. A designation can be deleted once no one holds it."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="designation" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={BadgeCheck} title="No designations yet" action={addButton}>
            Add the positions staff can hold.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Designations"
          rows={rows}
          kind="designation"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/staff/designations/${row.id}`}
          deleteAction={(row) => deleteDesignation.bind(null, row.id)}
          columns={[
            { header: "Name", cell: (row) => row.name },
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
