import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { CENTRE_GROUPS, centreFields, getCentreForm } from "@/lib/cms/resources/about-page";
import { recordId } from "@/lib/cms/validation";

import { deleteCentre, saveCentre } from "../../actions";

export const metadata: Metadata = { title: "Edit centre" };

export default async function Page({ params }: PageProps<"/admin/about-page/centres/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getCentreForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("centres", {
    label: "Position",
    help: "Where it appears among the centres of its kind.",
    groups: CENTRE_GROUPS.map((g) => g.value),
    groupField: "group",
    current: { id: id.data, group: initial.values.group },
  });
  const name = initial.values.acronym;

  return (
    <>
      <PageHeader
        title="Edit centre"
        description={name}
        actions={
          <DeleteButton action={deleteCentre.bind(null, id.data)} itemName={name} kind="centre" />
        }
      />
      <ResourceForm
        action={saveCentre.bind(null, id.data)}
        fields={withPosition(centreFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/about-page#centres"
      />
    </>
  );
}
