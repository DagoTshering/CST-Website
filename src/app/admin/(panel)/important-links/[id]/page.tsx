import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { getImportantLinkForm, importantLinkFields } from "@/lib/cms/resources/important-links";
import { recordId } from "@/lib/cms/validation";

import { deleteImportantLink, saveImportantLink } from "../actions";

export const metadata: Metadata = { title: "Edit link" };

export default async function Page({ params }: PageProps<"/admin/important-links/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getImportantLinkForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("importantLinks", {
    label: "Position",
    help: "Where the link appears in the menu.",
    current: { id: id.data, group: "all" },
  });
  const label = initial.values.label;

  return (
    <>
      <PageHeader
        title="Edit link"
        description={label}
        actions={
          <DeleteButton
            action={deleteImportantLink.bind(null, id.data)}
            itemName={label}
            kind="link"
          />
        }
      />
      <ResourceForm
        action={saveImportantLink.bind(null, id.data)}
        fields={withPosition(importantLinkFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/important-links"
      />
    </>
  );
}
