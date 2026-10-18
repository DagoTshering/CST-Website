import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { facilityFields } from "@/lib/cms/resources/facilities";

import { saveFacility } from "../actions";

export const metadata: Metadata = { title: "Add facility" };

export default async function Page() {
  await requireAdmin();
  const position = await positionForm("facilities", {
    label: "Position",
    help: "Where it appears in the homepage’s facilities carousel.",
  });
  return (
    <>
      <PageHeader
        title="Add facility"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveFacility.bind(null, null)}
        fields={withPosition(facilityFields, position.fields)}
        initial={{ values: { ...position.values, status: "draft" }, media: {} }}
        submitLabel="Create facility"
        cancelHref="/admin/facilities"
      />
    </>
  );
}
