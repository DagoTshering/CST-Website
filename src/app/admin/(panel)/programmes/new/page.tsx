import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { programmeFields } from "@/lib/cms/resources/programmes";

import { saveProgramme } from "../actions";

export const metadata: Metadata = { title: "Add programme" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add programme"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveProgramme.bind(null, null)}
        fields={programmeFields}
        initial={{ values: { status: "draft", sortOrder: "0", level: "" }, media: {} }}
        submitLabel="Create programme"
        cancelHref="/admin/programmes"
      />
    </>
  );
}
