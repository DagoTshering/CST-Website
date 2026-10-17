import { Users, Plus } from "lucide-react";
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
import { listLeaders } from "@/lib/cms/resources/leaders";

import { deleteLeader } from "./actions";

export const metadata: Metadata = { title: "Leadership & Governance" };

export default async function Page({ searchParams }: PageProps<"/admin/leadership">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listLeaders()]);
  const addButton = (
    <LinkButton href="/admin/leadership/new">
      <Plus aria-hidden="true" />
      Add profile
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Leadership & Governance"
        description="Profiles of the college’s leadership. The published profile with the lowest display order is featured on the homepage."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="leadership profile" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No leadership profiles yet" action={addButton}>
            Add a leadership profile to feature it on the homepage.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Leadership & Governance"
          rows={rows}
          kind="leadership profile"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/leadership/${row.id}`}
          deleteAction={(row) => deleteLeader.bind(null, row.id)}
          columns={[
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            { header: "Designation", cell: (row) => row.designation, wide: true },
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
