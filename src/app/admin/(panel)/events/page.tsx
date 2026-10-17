import { CalendarDays, Plus } from "lucide-react";
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
import { listEvents } from "@/lib/cms/resources/events";
import { formatDate } from "@/lib/dates";

import { deleteEvent } from "./actions";

export const metadata: Metadata = { title: "Events" };

export default async function Page({ searchParams }: PageProps<"/admin/events">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listEvents()]);
  const addButton = (
    <LinkButton href="/admin/events/new">
      <Plus aria-hidden="true" />
      Add event
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Events"
        description="The latest published events appear in the carousel on the homepage, newest first."
        actions={rows.length > 0 && addButton}
      />
      <ListNotice notice={notice} kind="event" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="No events yet" action={addButton}>
            Create an event to show it on the homepage.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Events"
          rows={rows}
          kind="event"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/events/${row.id}`}
          deleteAction={(row) => deleteEvent.bind(null, row.id)}
          columns={[
            {
              header: "Event",
              cell: (row) => <TitleWithThumb title={row.title} image={row.image} />,
            },
            {
              header: "Date",
              cell: (row) =>
                row.endDate
                  ? `${formatDate(row.startDate)} – ${formatDate(row.endDate)}`
                  : formatDate(row.startDate),
              className: "whitespace-nowrap",
            },
            { header: "Location", cell: (row) => row.location ?? "—", wide: true },
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
