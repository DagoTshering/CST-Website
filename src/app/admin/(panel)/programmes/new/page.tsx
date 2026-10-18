import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { PROGRAMME_LEVELS, programmeFields } from "@/lib/cms/resources/programmes";
import { listDepartmentOptions } from "@/lib/cms/resources/staff";

import { saveProgramme } from "../actions";

export const metadata: Metadata = { title: "Add programme" };

export default async function Page() {
  await requireAdmin();
  const [position, departments] = await Promise.all([
    positionForm("programmes", {
      label: "Position",
      help: "Where it appears among the programmes of its level.",
      groups: PROGRAMME_LEVELS.map((level) => level.value),
      groupField: "level",
    }),
    listDepartmentOptions(),
  ]);
  return (
    <>
      <PageHeader
        title="Add programme"
        description="Save as a draft to keep it off the public website until it is ready. Its modules and facilities are added once it is created."
      />
      <ResourceForm
        action={saveProgramme.bind(null, null)}
        fields={withPosition(programmeFields(departments), position.fields)}
        initial={{ values: { ...position.values, status: "draft", level: "" }, media: {} }}
        submitLabel="Create programme"
        cancelHref="/admin/programmes"
      />
    </>
  );
}
