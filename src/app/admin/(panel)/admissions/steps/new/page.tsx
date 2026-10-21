import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { stepTypeFields } from "@/lib/cms/resources/admission";

import { saveAdmissionStepType } from "../../actions";

export const metadata: Metadata = { title: "Add step" };

export default async function Page() {
  const position = await positionForm("admissionStepTypes", {
    label: "Position",
    help: "Where it appears in the list of steps when a date is added.",
  });
  return (
    <>
      <PageHeader
        title="Add step"
        description="A step of the intake. Give it a date under Important dates."
      />
      <ResourceForm
        action={saveAdmissionStepType.bind(null, null)}
        fields={withPosition(stepTypeFields, position.fields)}
        initial={{ values: { ...position.values, mark: "" }, media: {} }}
        submitLabel="Add step"
        cancelHref="/admin/admissions/steps"
      />
    </>
  );
}
