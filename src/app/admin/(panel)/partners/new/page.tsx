import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { PARTNER_CATEGORIES, partnerFields } from "@/lib/cms/resources/partners";

import { savePartner } from "../actions";

export const metadata: Metadata = { title: "Add partner" };

export default async function Page({ searchParams }: PageProps<"/admin/partners/new">) {
  const { category } = await searchParams;
  const position = await positionForm("partners", {
    label: "Position",
    help: "Where it appears among the partners of its country or type.",
    groups: PARTNER_CATEGORIES.map((c) => c.value),
    groupField: "category",
  });
  return (
    <>
      <PageHeader
        title="Add partner"
        description="Save as a draft to keep it off the Partners page until the details are ready."
      />
      <ResourceForm
        action={savePartner.bind(null, null)}
        fields={withPosition(partnerFields, position.fields)}
        initial={{
          values: {
            ...position.values,
            category: category === "national" ? "national" : "international",
            type: category === "national" ? "government" : "university",
            country: category === "national" ? "Bhutan" : "",
            status: "draft",
          },
          media: {},
        }}
        submitLabel="Create partner"
        cancelHref="/admin/partners"
      />
    </>
  );
}
