import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { officeFields, getOfficeForm } from "@/lib/cms/resources/contact";
import { recordId } from "@/lib/cms/validation";

import { deleteContactOffice, saveContactOffice } from "../../actions";

export const metadata: Metadata = { title: "Edit office" };

export default async function Page({ params }: PageProps<"/admin/contact/offices/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getOfficeForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("contactOffices", {
    label: "Position",
    help: "Where it appears in the directory.",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit office"
        description={name}
        actions={
          <DeleteButton
            action={deleteContactOffice.bind(null, id.data)}
            itemName={name}
            kind="office"
          />
        }
      />
      <ResourceForm
        action={saveContactOffice.bind(null, id.data)}
        fields={withPosition(officeFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/contact#offices"
      />
    </>
  );
}
