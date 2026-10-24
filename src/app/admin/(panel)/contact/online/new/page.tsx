import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { socialFields } from "@/lib/cms/resources/contact";

import { saveContactSocial } from "../../actions";

export const metadata: Metadata = { title: "Add link" };

export default async function Page() {
  const position = await positionForm("contactSocial", {
    label: "Position",
    help: "Where it appears under Find us online.",
  });
  return (
    <>
      <PageHeader
        title="Add link"
        description="A page of the college on another site, under Find us online."
      />
      <ResourceForm
        action={saveContactSocial.bind(null, null)}
        fields={withPosition(socialFields, position.fields)}
        initial={{ values: { ...position.values, status: "published" }, media: {} }}
        submitLabel="Add link"
        cancelHref="/admin/contact#online"
      />
    </>
  );
}
