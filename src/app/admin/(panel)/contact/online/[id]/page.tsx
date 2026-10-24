import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { socialFields, getSocialForm } from "@/lib/cms/resources/contact";
import { recordId } from "@/lib/cms/validation";

import { deleteContactSocial, saveContactSocial } from "../../actions";

export const metadata: Metadata = { title: "Edit link" };

export default async function Page({ params }: PageProps<"/admin/contact/online/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getSocialForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("contactSocial", {
    label: "Position",
    help: "Where it appears under Find us online.",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.label;

  return (
    <>
      <PageHeader
        title="Edit link"
        description={name}
        actions={
          <DeleteButton
            action={deleteContactSocial.bind(null, id.data)}
            itemName={name}
            kind="link"
          />
        }
      />
      <ResourceForm
        action={saveContactSocial.bind(null, id.data)}
        fields={withPosition(socialFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/contact#online"
      />
    </>
  );
}
