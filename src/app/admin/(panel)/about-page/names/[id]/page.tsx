import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { getNameForm, nameFields } from "@/lib/cms/resources/about-page";
import { recordId } from "@/lib/cms/validation";

import { deleteCollegeName, saveCollegeName } from "../../actions";

export const metadata: Metadata = { title: "Edit name" };

export default async function Page({ params }: PageProps<"/admin/about-page/names/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getNameForm(id.data);
  if (!initial) notFound();
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit name"
        description={name}
        actions={
          <DeleteButton
            action={deleteCollegeName.bind(null, id.data)}
            itemName={name}
            kind="name"
          />
        }
      />
      <ResourceForm
        action={saveCollegeName.bind(null, id.data)}
        fields={nameFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/about-page#names"
      />
    </>
  );
}
