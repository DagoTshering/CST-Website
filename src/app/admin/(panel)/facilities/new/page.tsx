import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { facilityFields } from "@/lib/cms/resources/facilities";

import { saveFacility } from "../actions";

export const metadata: Metadata = { title: "Add facility" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add facility"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveFacility.bind(null, null)}
        fields={facilityFields}
        initial={{ values: { status: "draft", sortOrder: "0" }, media: {} }}
        submitLabel="Create facility"
        cancelHref="/admin/facilities"
      />
    </>
  );
}
