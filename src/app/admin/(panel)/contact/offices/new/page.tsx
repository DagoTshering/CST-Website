import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { officeFields } from "@/lib/cms/resources/contact";

import { saveContactOffice } from "../../actions";

export const metadata: Metadata = { title: "Add office" };

export default async function Page() {
  const position = await positionForm("contactOffices", {
    label: "Position",
    help: "Where it appears in the directory.",
  });
  return (
    <>
      <PageHeader title="Add office" description="A new office in the Contact page's directory." />
      <ResourceForm
        action={saveContactOffice.bind(null, null)}
        fields={withPosition(officeFields, position.fields)}
        initial={{ values: { ...position.values, status: "published" }, media: {} }}
        submitLabel="Add office"
        cancelHref="/admin/contact#offices"
      />
    </>
  );
}
