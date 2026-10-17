import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { eventFields } from "@/lib/cms/resources/events";

import { saveEvent } from "../actions";

export const metadata: Metadata = { title: "Add event" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add event"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveEvent.bind(null, null)}
        fields={eventFields}
        initial={{ values: { status: "draft" }, media: {} }}
        submitLabel="Create event"
        cancelHref="/admin/events"
      />
    </>
  );
}
