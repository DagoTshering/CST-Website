import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { programmeFields, getProgrammeForm } from "@/lib/cms/resources/programmes";
import { recordId } from "@/lib/cms/validation";

import { deleteProgramme, saveProgramme } from "../actions";

export const metadata: Metadata = { title: "Edit programme" };

export default async function Page({ params }: PageProps<"/admin/programmes/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getProgrammeForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("programmes", {
    label: "Position",
    help: "Where it appears in the homepage’s list of programmes (within its level).",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit programme"
        description={name}
        actions={
          <DeleteButton
            action={deleteProgramme.bind(null, id.data)}
            itemName={name}
            kind="programme"
          />
        }
      />
      <ResourceForm
        action={saveProgramme.bind(null, id.data)}
        fields={withPosition(programmeFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/programmes"
      />
    </>
  );
}
