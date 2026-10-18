import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  getStaffForm,
  listDepartmentOptions,
  listDesignationOptions,
  listProgrammeChoices,
  staffFields,
} from "@/lib/cms/resources/staff";
import { recordId } from "@/lib/cms/validation";

import { deleteStaff, saveStaff } from "../actions";

export const metadata: Metadata = { title: "Edit staff member" };

export default async function Page({ params }: PageProps<"/admin/staff/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const [initial, departments, programmes, designations] = await Promise.all([
    getStaffForm(id.data),
    listDepartmentOptions(),
    listProgrammeChoices(),
    listDesignationOptions(),
  ]);
  if (!initial) notFound();
  const position = await positionForm("staff", {
    label: "Position in department",
    help: "Where they appear within their department in the directory.",
    groups: departments.map((d) => String(d.id)),
    groupField: "departmentId",
    current: { id: id.data, group: initial.values.departmentId },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit staff member"
        description={name}
        actions={
          <DeleteButton
            action={deleteStaff.bind(null, id.data)}
            itemName={name}
            kind="staff member"
          />
        }
      />
      <ResourceForm
        action={saveStaff.bind(null, id.data)}
        fields={withPosition(staffFields(departments, programmes, designations), position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/staff"
      />
    </>
  );
}
