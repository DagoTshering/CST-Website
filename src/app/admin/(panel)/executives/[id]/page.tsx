import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  chartRows,
  executiveFields,
  getExecutiveForm,
  freeDeanAreas,
  listStaffOptions,
} from "@/lib/cms/resources/executives";
import { recordId } from "@/lib/cms/validation";

import { deleteExecutive, saveExecutive } from "../actions";

export const metadata: Metadata = { title: "Edit executive" };

export default async function Page({ params }: PageProps<"/admin/executives/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const [initial, staff, rows, areas] = await Promise.all([
    getExecutiveForm(id.data),
    listStaffOptions(),
    chartRows(id.data),
    freeDeanAreas(id.data),
  ]);
  if (!initial) notFound();
  // their own row, and any other with room for them
  const levels = rows
    .filter((row) => !row.full || String(row.level) === initial.values.level)
    .map((row) => row.level);
  const position = await positionForm("executives", {
    label: "Position in row",
    help: "Left to right within their row of the chart.",
    groups: ["1", "2"],
    groupField: "level",
    current: { id: id.data, group: initial.values.level },
  });
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit executive"
        description={name}
        actions={
          <DeleteButton
            action={deleteExecutive.bind(null, id.data)}
            itemName={name}
            kind="executive"
          />
        }
      />
      <ResourceForm
        action={saveExecutive.bind(null, id.data)}
        fields={withPosition(executiveFields(staff, levels, areas), position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/executives"
      />
    </>
  );
}
