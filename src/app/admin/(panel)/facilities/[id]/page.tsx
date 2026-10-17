import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { facilityFields, getFacilityForm } from "@/lib/cms/resources/facilities";
import { recordId } from "@/lib/cms/validation";

import { deleteFacility, saveFacility } from "../actions";

export const metadata: Metadata = { title: "Edit facility" };

export default async function Page({ params }: PageProps<"/admin/facilities/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getFacilityForm(id.data);
  if (!initial) notFound();
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit facility"
        description={name}
        actions={
          <DeleteButton
            action={deleteFacility.bind(null, id.data)}
            itemName={name}
            kind="facility"
          />
        }
      />
      <ResourceForm
        action={saveFacility.bind(null, id.data)}
        fields={facilityFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/facilities"
      />
    </>
  );
}
