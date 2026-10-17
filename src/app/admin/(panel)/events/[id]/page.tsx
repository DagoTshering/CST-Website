import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { eventFields, getEventForm } from "@/lib/cms/resources/events";
import { recordId } from "@/lib/cms/validation";

import { deleteEvent, saveEvent } from "../actions";

export const metadata: Metadata = { title: "Edit event" };

export default async function Page({ params }: PageProps<"/admin/events/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getEventForm(id.data);
  if (!initial) notFound();
  const name = initial.values.title;

  return (
    <>
      <PageHeader
        title="Edit event"
        description={name}
        actions={
          <DeleteButton action={deleteEvent.bind(null, id.data)} itemName={name} kind="event" />
        }
      />
      <ResourceForm
        action={saveEvent.bind(null, id.data)}
        fields={eventFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/events"
      />
    </>
  );
}
