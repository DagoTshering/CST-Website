import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm } from "@/lib/cms/ordering";
import { programmeFacilityFields, getProgrammeName } from "@/lib/cms/resources/programme-pages";
import { recordId } from "@/lib/cms/validation";

import { saveProgrammeFacility } from "../../../actions";

export const metadata: Metadata = { title: "Add facility" };

export default async function Page({ params }: PageProps<"/admin/programmes/[id]/facilities/new">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const name = await getProgrammeName(id.data);
  if (name === null) notFound();
  const position = await positionForm("programmeFacilities", {
    label: "Position",
    help: "Where it appears in the programme’s list.",
    groups: [String(id.data)],
  });
  return (
    <>
      <PageHeader title="Add facility" description={name} />
      <ResourceForm
        action={saveProgrammeFacility.bind(null, id.data, null)}
        fields={[...programmeFacilityFields, ...position.fields]}
        initial={{ values: { ...position.values }, media: {} }}
        submitLabel="Add facility"
        cancelHref={`/admin/programmes/${id.data}#facilities`}
      />
    </>
  );
}
