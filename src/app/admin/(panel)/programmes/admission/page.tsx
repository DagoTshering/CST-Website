import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { admissionFields, getAdmissionForm } from "@/lib/cms/resources/programme-pages";

import { saveAdmission } from "../actions";

export const metadata: Metadata = { title: "Admission details" };

export default async function Page() {
  const initial = await getAdmissionForm();
  return (
    <>
      <PageHeader
        title="Admission details"
        description="Shown under the entry requirements on every bachelor’s programme page."
      />
      <ResourceForm
        action={saveAdmission}
        fields={admissionFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/programmes"
      />
    </>
  );
}
