import { GraduationCap, Plus } from "lucide-react";
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
import { listProgrammes } from "@/lib/cms/resources/programmes";

import { deleteProgramme } from "./actions";

export const metadata: Metadata = { title: "Academic Programmes" };

export default async function Page({ searchParams }: PageProps<"/admin/programmes">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listProgrammes()]);
  const addButton = (
    <LinkButton href="/admin/programmes/new">
      <Plus aria-hidden="true" />
      Add programme
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Academic Programmes"
        description="Programmes listed in the Academic section of the homepage, grouped by level. The hero clock is not affected."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="programme" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title="No academic programmes yet" action={addButton}>
            Add a programme to list it in the Academic section of the homepage.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Academic Programmes"
          rows={rows}
          kind="programme"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/programmes/${row.id}`}
          deleteAction={(row) => deleteProgramme.bind(null, row.id)}
          columns={[
            {
              header: "Programme",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            {
              header: "Level",
              cell: (row) => (row.level === "postgraduate" ? "Postgraduate" : "Undergraduate"),
            },
            { header: "Year", cell: (row) => row.startYear ?? "—", wide: true },
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
