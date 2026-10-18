import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  downloadFields,
  listCategoryOptions,
  listProgrammeOptions,
} from "@/lib/cms/resources/downloads";

import { saveDownload } from "../actions";

export const metadata: Metadata = { title: "Add download" };

export default async function Page({ searchParams }: PageProps<"/admin/downloads/new">) {
  const [{ category }, categories, programmes] = await Promise.all([
    searchParams,
    listCategoryOptions(),
    listProgrammeOptions(),
  ]);
  const preselected = categories.some((c) => String(c.id) === category) ? String(category) : "";

  const position = await positionForm("downloads", {
    label: "Position in category",
    help: "Where it appears within its category (a project report: within its programme).",
    groups: categories.map((c) => String(c.id)),
    groupField: "categoryId",
  });
  return (
    <>
      <PageHeader
        title="Add download"
        description="Upload a PDF, or link to a document elsewhere. Save as a draft to keep it off the website until it is ready."
      />
      <ResourceForm
        action={saveDownload.bind(null, null)}
        fields={withPosition(downloadFields(categories, programmes), position.fields)}
        initial={{
          values: { ...position.values, status: "draft", kind: "file", categoryId: preselected },
          media: {},
        }}
        submitLabel="Create download"
        cancelHref="/admin/downloads"
      />
    </>
  );
}
