import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  downloadFields,
  getDownloadForm,
  listCategoryOptions,
  listProgrammeOptions,
} from "@/lib/cms/resources/downloads";
import { recordId } from "@/lib/cms/validation";

import { deleteDownload, saveDownload } from "../actions";

export const metadata: Metadata = { title: "Edit download" };

export default async function Page({ params }: PageProps<"/admin/downloads/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const [initial, categories, programmes] = await Promise.all([
    getDownloadForm(id.data),
    listCategoryOptions(),
    listProgrammeOptions(),
  ]);
  if (!initial) notFound();
  const position = await positionForm("downloads", {
    label: "Position in category",
    help: "Where it appears within its category (a project report: within its programme).",
    groups: categories.map((c) => String(c.id)),
    groupField: "categoryId",
    current: { id: id.data, group: initial.values.categoryId },
  });
  const name = initial.values.title;

  return (
    <>
      <PageHeader
        title="Edit download"
        description={name}
        actions={
          <DeleteButton
            action={deleteDownload.bind(null, id.data)}
            itemName={name}
            kind="download"
          />
        }
      />
      <ResourceForm
        action={saveDownload.bind(null, id.data)}
        fields={withPosition(downloadFields(categories, programmes), position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/downloads"
      />
    </>
  );
}
