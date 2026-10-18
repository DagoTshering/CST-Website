import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm } from "@/lib/cms/ordering";
import { moduleFields, getModuleForm, getProgrammeName } from "@/lib/cms/resources/programme-pages";
import { recordId } from "@/lib/cms/validation";

import { deleteModule, saveModule } from "../../../actions";

export const metadata: Metadata = { title: "Edit module" };

export default async function Page({
  params,
}: PageProps<"/admin/programmes/[id]/modules/[moduleId]">) {
  const { id: rawId, moduleId: rawPartId } = await params;
  const id = recordId.safeParse(rawId);
  const partId = recordId.safeParse(rawPartId);
  if (!id.success || !partId.success) notFound();
  const [name, initial] = await Promise.all([
    getProgrammeName(id.data),
    getModuleForm(id.data, partId.data),
  ]);
  if (name === null || !initial) notFound();
  const group = String(id.data);
  const position = await positionForm("programmeModules", {
    label: "Position",
    help: "Where it appears in the programme’s list.",
    groups: [group],
    current: { id: partId.data, group },
  });

  return (
    <>
      <PageHeader
        title="Edit module"
        description={name}
        actions={
          <DeleteButton
            action={deleteModule.bind(null, id.data, partId.data)}
            itemName={initial.values.name}
            kind="module"
          />
        }
      />
      <ResourceForm
        action={saveModule.bind(null, id.data, partId.data)}
        fields={[...moduleFields, ...position.fields]}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref={`/admin/programmes/${id.data}#modules`}
      />
    </>
  );
}
