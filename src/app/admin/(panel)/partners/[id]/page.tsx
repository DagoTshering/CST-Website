import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { getPartnerForm, PARTNER_CATEGORIES, partnerFields } from "@/lib/cms/resources/partners";
import { recordId } from "@/lib/cms/validation";

import { deletePartner, savePartner } from "../actions";

export const metadata: Metadata = { title: "Edit partner" };

export default async function Page({ params }: PageProps<"/admin/partners/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getPartnerForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("partners", {
    label: "Position",
    help: "Where it appears among the partners of its country or type.",
    groups: PARTNER_CATEGORIES.map((c) => c.value),
    groupField: "category",
    current: { id: id.data, group: initial.values.category },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit partner"
        description={name}
        actions={
          <DeleteButton action={deletePartner.bind(null, id.data)} itemName={name} kind="partner" />
        }
      />
      <ResourceForm
        action={savePartner.bind(null, id.data)}
        fields={withPosition(partnerFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/partners"
      />
    </>
  );
}
