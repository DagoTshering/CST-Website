import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { getStepTypeForm, stepTypeFields } from "@/lib/cms/resources/admission";
import { recordId } from "@/lib/cms/validation";

import { deleteAdmissionStepType, saveAdmissionStepType } from "../../actions";

export const metadata: Metadata = { title: "Edit step" };

export default async function Page({ params }: PageProps<"/admin/admissions/steps/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getStepTypeForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("admissionStepTypes", {
    label: "Position",
    help: "Where it appears in the list of steps when a date is added.",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit step"
        description="Renaming it renames it on the Admissions page."
        actions={
          <DeleteButton
            action={deleteAdmissionStepType.bind(null, id.data)}
            itemName={name}
            kind="step"
          />
        }
      />
      <ResourceForm
        action={saveAdmissionStepType.bind(null, id.data)}
        fields={withPosition(stepTypeFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/admissions/steps"
      />
    </>
  );
}
