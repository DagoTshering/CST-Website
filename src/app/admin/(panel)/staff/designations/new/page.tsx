import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { designationFields } from "@/lib/cms/resources/staff";

import { saveDesignation } from "../../actions";

export const metadata: Metadata = { title: "Add designation" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add designation" description="A position staff can hold." />
      <ResourceForm
        action={saveDesignation.bind(null, null)}
        fields={designationFields}
        initial={{ values: {}, media: {} }}
        submitLabel="Create designation"
        cancelHref="/admin/staff/designations"
      />
    </>
  );
}
