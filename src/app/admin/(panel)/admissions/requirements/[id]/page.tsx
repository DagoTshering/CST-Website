import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  getTrackForm,
  listAdmissionProgrammeChoices,
  trackFields,
} from "@/lib/cms/resources/admission";
import { recordId } from "@/lib/cms/validation";

import { deleteAdmissionTrack, saveAdmissionTrack } from "../../actions";

export const metadata: Metadata = { title: "Edit requirements" };

export default async function Page({ params }: PageProps<"/admin/admissions/requirements/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getTrackForm(id.data);
  if (!initial) notFound();
  const [choices, position] = await Promise.all([
    listAdmissionProgrammeChoices(),
    positionForm("admissionTracks", {
      label: "Position",
      help: "Where these tables appear among the kinds of programme.",
      current: { id: id.data, group: "all" },
    }),
  ]);
  const name = initial.values.title;

  return (
    <>
      <PageHeader
        title="Edit requirements"
        description={name}
        actions={
          <DeleteButton
            action={deleteAdmissionTrack.bind(null, id.data)}
            itemName={name}
            kind="requirements"
          />
        }
      />
      <ResourceForm
        action={saveAdmissionTrack.bind(null, id.data)}
        fields={withPosition(trackFields(choices), position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/admissions#requirements"
      />
    </>
  );
}
