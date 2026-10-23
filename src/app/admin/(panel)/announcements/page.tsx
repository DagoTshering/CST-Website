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
        description="General college notices: the latest four on the homepage, all of them on the Announcements page (/announcements), newest publication date first. Job recruitment notices are under Vacancies."
        actions={
          <>
            <LinkButton href="/announcements" variant="secondary">
              View page
            </LinkButton>
            {rows.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="announcement" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Megaphone} title="No announcements yet" action={addButton}>
            Publish an announcement to show it on the homepage and the Announcements page.
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
