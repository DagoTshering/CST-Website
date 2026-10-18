import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  listDepartmentOptions,
  listDesignationOptions,
  listProgrammeChoices,
  staffFields,
} from "@/lib/cms/resources/staff";

import { saveStaff } from "../actions";

export const metadata: Metadata = { title: "Add staff member" };

export default async function Page() {
  const [departments, programmes, designations] = await Promise.all([
    listDepartmentOptions(),
    listProgrammeChoices(),
    listDesignationOptions(),
  ]);
  const position = await positionForm("staff", {
    label: "Position in department",
    help: "Where they appear within their department in the directory.",
    groups: departments.map((d) => String(d.id)),
    groupField: "departmentId",
  });
  return (
    <>
      <PageHeader
        title="Add staff member"
        description="Save as a draft to keep them out of the directory until the details are ready."
      />
      <ResourceForm
        action={saveStaff.bind(null, null)}
        fields={withPosition(staffFields(departments, programmes, designations), position.fields)}
        initial={{ values: { ...position.values, status: "draft" }, media: {} }}
        submitLabel="Create staff member"
        cancelHref="/admin/staff"
      />
    </>
  );
}
