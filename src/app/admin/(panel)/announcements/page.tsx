import { Megaphone, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, DocumentBadge, ListNotice } from "@/components/admin/DataTable";
import {
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { listAnnouncements } from "@/lib/cms/resources/announcements";
import { formatDate } from "@/lib/dates";

import { deleteAnnouncement } from "./actions";

export const metadata: Metadata = { title: "Announcements" };

export default async function Page({ searchParams }: PageProps<"/admin/announcements">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listAnnouncements()]);
  const addButton = (
    <LinkButton href="/admin/announcements/new">
      <Plus aria-hidden="true" />
      New announcement
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Notices listed on the homepage, newest publication date first."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="announcement" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Megaphone} title="No announcements yet" action={addButton}>
            Publish an announcement to list it on the homepage.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Announcements"
          rows={rows}
          kind="announcement"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/announcements/${row.id}`}
          deleteAction={(row) => deleteAnnouncement.bind(null, row.id)}
          columns={[
            {
              header: "Title",
              cell: (row) => (
                <span className="flex flex-wrap items-center gap-x-2">
                  {row.title}
                  {row.hasAttachment && <DocumentBadge />}
                </span>
              ),
            },
            { header: "Category", cell: (row) => row.category ?? "—", wide: true },
            {
              header: "Published on",
              cell: (row) => formatDate(row.publishedOn),
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
