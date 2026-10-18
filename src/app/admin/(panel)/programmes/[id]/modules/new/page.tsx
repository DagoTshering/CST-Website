import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm } from "@/lib/cms/ordering";
import { moduleFields, getProgrammeName } from "@/lib/cms/resources/programme-pages";
import { recordId } from "@/lib/cms/validation";

import { saveModule } from "../../../actions";

export const metadata: Metadata = { title: "Add module" };

export default async function Page({ params }: PageProps<"/admin/programmes/[id]/modules/new">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const name = await getProgrammeName(id.data);
  if (name === null) notFound();
  const position = await positionForm("programmeModules", {
    label: "Position",
    help: "Where it appears in the programme’s list.",
    groups: [String(id.data)],
  });
  return (
    <>
      <PageHeader title="Add module" description={name} />
      <ResourceForm
        action={saveModule.bind(null, id.data, null)}
        fields={[...moduleFields, ...position.fields]}
        initial={{ values: { ...position.values, descriptionConfirmed: "on" }, media: {} }}
        submitLabel="Add module"
        cancelHref={`/admin/programmes/${id.data}#modules`}
      />
    </>
  );
}
