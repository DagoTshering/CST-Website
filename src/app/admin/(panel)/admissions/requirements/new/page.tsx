import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { listAdmissionProgrammeChoices, trackFields } from "@/lib/cms/resources/admission";

import { saveAdmissionTrack } from "../../actions";

export const metadata: Metadata = { title: "Add requirements" };

export default async function Page() {
  const [choices, position] = await Promise.all([
    listAdmissionProgrammeChoices(),
    positionForm("admissionTracks", {
      label: "Position",
      help: "Where these tables appear among the kinds of programme.",
    }),
  ]);
  return (
    <>
      <PageHeader
        title="Add requirements"
        description="The entry requirements of one kind of programme, e.g. Engineering, and the programmes they apply to."
      />
      <ResourceForm
        action={saveAdmissionTrack.bind(null, null)}
        fields={withPosition(trackFields(choices), position.fields)}
        initial={{ values: { ...position.values }, media: {} }}
        submitLabel="Add requirements"
        cancelHref="/admin/admissions#requirements"
      />
    </>
  );
}
