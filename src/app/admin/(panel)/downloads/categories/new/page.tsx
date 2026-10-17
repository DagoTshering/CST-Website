import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { categoryFields } from "@/lib/cms/resources/downloads";

import { saveCategory } from "../../actions";

export const metadata: Metadata = { title: "Add category" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add category" description="A new section of the Downloads page." />
      <ResourceForm
        action={saveCategory.bind(null, null)}
        fields={categoryFields}
        initial={{ values: { sortOrder: "0", grouping: "heading" }, media: {} }}
        submitLabel="Create category"
        cancelHref="/admin/downloads/categories"
      />
    </>
  );
}
