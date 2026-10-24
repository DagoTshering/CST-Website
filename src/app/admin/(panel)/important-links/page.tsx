import { Link2, ListOrdered, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import {
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { listImportantLinks } from "@/lib/cms/resources/important-links";

import { deleteImportantLink } from "./actions";

export const metadata: Metadata = { title: "Important links" };

export default async function Page({ searchParams }: PageProps<"/admin/important-links">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listImportantLinks()]);
  const addButton = (
    <LinkButton href="/admin/important-links/new">
      <Plus aria-hidden="true" />
      Add link
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Important links"
        description="The links under Others › Important Links in the site's menu, in display order. Only published links are shown."
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton href="/admin/important-links/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {rows.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="link" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Link2} title="No links yet" action={addButton}>
            Add a link to another CST website. While there are none, the menu leaves out Important
            Links.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Important links"
          rows={rows}
          kind="link"
          rowName={(row) => row.label}
          editHref={(row) => `/admin/important-links/${row.id}`}
          deleteAction={(row) => deleteImportantLink.bind(null, row.id)}
          columns={[
            { header: "Label", cell: (row) => row.label },
            {
              header: "Link",
              cell: (row) => row.url,
              wide: true,
              className: "break-all text-admin-muted",
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
