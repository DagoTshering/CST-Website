import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { programmeFields } from "@/lib/cms/resources/programmes";

import { saveProgramme } from "../actions";

export const metadata: Metadata = { title: "Add programme" };

export default async function Page() {
  await requireAdmin();
  const position = await positionForm("programmes", {
    label: "Position",
    help: "Where it appears in the homepage’s list of programmes (within its level).",
  });
  return (
    <>
      <PageHeader
        title="Add programme"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveProgramme.bind(null, null)}
        fields={withPosition(programmeFields, position.fields)}
        initial={{ values: { ...position.values, status: "draft", level: "" }, media: {} }}
        submitLabel="Create programme"
        cancelHref="/admin/programmes"
      />
    </>
  );
}
