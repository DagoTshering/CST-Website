import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { designationFields, getDesignationForm } from "@/lib/cms/resources/staff";
import { recordId } from "@/lib/cms/validation";

import { deleteDesignation, saveDesignation } from "../../actions";

export const metadata: Metadata = { title: "Edit designation" };

export default async function Page({ params }: PageProps<"/admin/staff/designations/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getDesignationForm(id.data);
  if (!initial) notFound();
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit designation"
        description="Renaming it changes it for everyone who holds it."
        actions={
          <DeleteButton
            action={deleteDesignation.bind(null, id.data)}
            itemName={name}
            kind="designation"
          />
        }
      />
      <ResourceForm
        action={saveDesignation.bind(null, id.data)}
        fields={designationFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/staff/designations"
      />
    </>
  );
}
