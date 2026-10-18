import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm } from "@/lib/cms/ordering";
import {
  programmeFacilityFields,
  getProgrammeFacilityForm,
  getProgrammeName,
} from "@/lib/cms/resources/programme-pages";
import { recordId } from "@/lib/cms/validation";

import { deleteProgrammeFacility, saveProgrammeFacility } from "../../../actions";

export const metadata: Metadata = { title: "Edit facility" };

export default async function Page({
  params,
}: PageProps<"/admin/programmes/[id]/facilities/[facilityId]">) {
  const { id: rawId, facilityId: rawPartId } = await params;
  const id = recordId.safeParse(rawId);
  const partId = recordId.safeParse(rawPartId);
  if (!id.success || !partId.success) notFound();
  const [name, initial] = await Promise.all([
    getProgrammeName(id.data),
    getProgrammeFacilityForm(id.data, partId.data),
  ]);
  if (name === null || !initial) notFound();
  const group = String(id.data);
  const position = await positionForm("programmeFacilities", {
    label: "Position",
    help: "Where it appears in the programme’s list.",
    groups: [group],
    current: { id: partId.data, group },
  });

  return (
    <>
      <PageHeader
        title="Edit facility"
        description={name}
        actions={
          <DeleteButton
            action={deleteProgrammeFacility.bind(null, id.data, partId.data)}
            itemName={initial.values.name}
            kind="facility"
          />
        }
      />
      <ResourceForm
        action={saveProgrammeFacility.bind(null, id.data, partId.data)}
        fields={[...programmeFacilityFields, ...position.fields]}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref={`/admin/programmes/${id.data}#facilities`}
      />
    </>
  );
}
