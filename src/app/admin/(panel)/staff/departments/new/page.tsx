import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { departmentFields } from "@/lib/cms/resources/staff";

import { saveDepartment } from "../../actions";

export const metadata: Metadata = { title: "Add department" };

export default async function Page() {
  await requireAdmin();
  const position = await positionForm("departments", {
    label: "Position",
    help: "Where the department appears in the Staff Directory.",
  });
  return (
    <>
      <PageHeader
        title="Add department"
        description="A department or unit of the Staff Directory."
      />
      <ResourceForm
        action={saveDepartment.bind(null, null)}
        fields={withPosition(departmentFields, position.fields)}
        initial={{ values: { ...position.values, kind: "department" }, media: {} }}
        submitLabel="Create department"
        cancelHref="/admin/staff/departments"
      />
    </>
  );
}
