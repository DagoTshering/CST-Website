import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { categoryFields } from "@/lib/cms/resources/downloads";

import { saveCategory } from "../../actions";

export const metadata: Metadata = { title: "Add category" };

export default async function Page() {
  await requireAdmin();
  const position = await positionForm("downloadCategories", {
    label: "Position",
    help: "Where the category appears on the Downloads page.",
  });
  return (
    <>
      <PageHeader title="Add category" description="A new section of the Downloads page." />
      <ResourceForm
        action={saveCategory.bind(null, null)}
        fields={withPosition(categoryFields, position.fields)}
        initial={{ values: { ...position.values, grouping: "heading" }, media: {} }}
        submitLabel="Create category"
        cancelHref="/admin/downloads/categories"
      />
    </>
  );
}
