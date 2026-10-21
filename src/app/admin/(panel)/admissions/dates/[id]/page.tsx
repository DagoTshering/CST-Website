import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { getStepForm, listStepChoices, stepFields } from "@/lib/cms/resources/admission";
import { recordId } from "@/lib/cms/validation";

import { deleteAdmissionStep, saveAdmissionStep } from "../../actions";

export const metadata: Metadata = { title: "Edit date" };

export default async function Page({ params }: PageProps<"/admin/admissions/dates/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const [initial, steps] = await Promise.all([getStepForm(id.data), listStepChoices(id.data)]);
  if (!initial) notFound();

  return (
    <>
      <PageHeader
        title="Edit date"
        description={initial.name}
        actions={
          <DeleteButton
            action={deleteAdmissionStep.bind(null, id.data)}
            itemName={initial.name}
            kind="date"
          />
        }
      />
      <ResourceForm
        action={saveAdmissionStep.bind(null, id.data)}
        fields={stepFields(steps)}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/admissions#dates"
      />
    </>
  );
}
