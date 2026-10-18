import { Network, Plus, ListOrdered } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice, TitleWithThumb } from "@/components/admin/DataTable";
import {
  Card,
  EmptyState,
  Notice,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { chartRows, listExecutives } from "@/lib/cms/resources/executives";

import { deleteExecutive } from "./actions";

export const metadata: Metadata = { title: "Executives" };

export default async function Page({ searchParams }: PageProps<"/admin/executives">) {
  const [{ notice }, rows, chart] = await Promise.all([
    searchParams,
    listExecutives(),
    chartRows(),
  ]);
  const full = chart.every((row) => row.full);
  const addButton = (
    <LinkButton href="/admin/executives/new">
      <Plus aria-hidden="true" />
      Add executive
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Executives"
        description={`The chart on the Executives page: ${chart.map((row) => `${row.title} ${row.used} of ${row.limit}`).join(" · ")}. The President is also featured on the homepage.`}
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton href="/admin/executives/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {rows.length > 0 && !full && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="executive" />
      {chart
        .filter((row) => row.used > row.limit)
        .map((row) => (
          <Notice
            key={row.level}
            tone="warning"
            title={`Too many in the ${row.title} row`}
            className="mb-5"
          >
            There {row.used === 1 ? "is" : "are"} {row.used} but room for {row.limit}. The website
            shows only the first {row.limit === 1 ? "one" : row.limit} (see Arrange order); delete
            the {row.used - row.limit === 1 ? "one" : "ones"} that should not be there.
          </Notice>
        ))}
      {full && !chart.some((row) => row.used > row.limit) && (
        <Notice tone="info" className="mb-5">
          The chart is full ({chart.map((row) => `${row.limit} ${row.title}`).join(", ")}). To
          appoint someone new, delete the person they replace, then add the new one.
        </Notice>
      )}
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Network} title="No executives yet" action={addButton}>
            Add the President and the Deans to show the Executives page.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Executives"
          rows={rows}
          kind="executive"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/executives/${row.id}`}
          deleteAction={(row) => deleteExecutive.bind(null, row.id)}
          columns={[
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            {
              header: "Role",
              cell: (row) => (row.scope ? `${row.role} of ${row.scope}` : row.role),
            },
            {
              header: "On the chart",
              cell: (row) => (row.level === 1 ? "Head" : "Row below"),
              wide: true,
            },
            {
              header: "Staff record",
              cell: (row) => row.linked ?? "—",
              wide: true,
              className: "text-admin-muted",
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
