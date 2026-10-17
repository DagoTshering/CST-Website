import { Building2, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice, TitleWithThumb } from "@/components/admin/DataTable";
import {
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { listFacilities } from "@/lib/cms/resources/facilities";

import { deleteFacility } from "./actions";

export const metadata: Metadata = { title: "Facilities" };

export default async function Page({ searchParams }: PageProps<"/admin/facilities">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listFacilities()]);
  const addButton = (
    <LinkButton href="/admin/facilities/new">
      <Plus aria-hidden="true" />
      Add facility
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Campus facilities shown in the carousel on the homepage, in display order."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="facility" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="No facilities yet" action={addButton}>
            Add a facility to show it in the homepage carousel.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Facilities"
          rows={rows}
          kind="facility"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/facilities/${row.id}`}
          deleteAction={(row) => deleteFacility.bind(null, row.id)}
          columns={[
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            { header: "Order", cell: (row) => row.sortOrder, wide: true },
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
