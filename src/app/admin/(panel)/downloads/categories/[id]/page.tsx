import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { categoryFields, getCategoryForm } from "@/lib/cms/resources/downloads";
import { recordId } from "@/lib/cms/validation";

import { deleteCategory, saveCategory } from "../../actions";

export const metadata: Metadata = { title: "Edit category" };

export default async function Page({ params }: PageProps<"/admin/downloads/categories/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getCategoryForm(id.data);
  if (!initial) notFound();
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit category"
        description={name}
        actions={
          <DeleteButton
            action={deleteCategory.bind(null, id.data)}
            itemName={name}
            kind="category"
          />
        }
      />
      <ResourceForm
        action={saveCategory.bind(null, id.data)}
        fields={categoryFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/downloads/categories"
      />
    </>
  );
}
