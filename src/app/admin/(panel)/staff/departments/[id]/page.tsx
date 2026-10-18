import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { departmentFields, getDepartmentForm } from "@/lib/cms/resources/staff";
import { recordId } from "@/lib/cms/validation";

import { deleteDepartment, saveDepartment } from "../../actions";

export const metadata: Metadata = { title: "Edit department" };

export default async function Page({ params }: PageProps<"/admin/staff/departments/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getDepartmentForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("departments", {
    label: "Position",
    help: "Where the department appears in the Staff Directory.",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit department"
        description={name}
        actions={
          <DeleteButton
            action={deleteDepartment.bind(null, id.data)}
            itemName={name}
            kind="department"
          />
        }
      />
      <ResourceForm
        action={saveDepartment.bind(null, id.data)}
        fields={withPosition(departmentFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/staff/departments"
      />
    </>
  );
}
