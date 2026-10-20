import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { CENTRE_GROUPS, centreFields } from "@/lib/cms/resources/about-page";

import { saveCentre } from "../../actions";

export const metadata: Metadata = { title: "Add centre" };

export default async function Page() {
  const position = await positionForm("centres", {
    label: "Position",
    help: "Where it appears among the centres of its kind.",
    groups: CENTRE_GROUPS.map((g) => g.value),
    groupField: "group",
  });
  return (
    <>
      <PageHeader
        title="Add centre"
        description="Save as a draft to keep it off the About page until it is ready."
      />
      <ResourceForm
        action={saveCentre.bind(null, null)}
        fields={withPosition(centreFields, position.fields)}
        initial={{ values: { ...position.values, status: "draft", group: "" }, media: {} }}
        submitLabel="Add centre"
        cancelHref="/admin/about-page#centres"
      />
    </>
  );
}
