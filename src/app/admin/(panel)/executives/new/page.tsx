import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import {
  chartRows,
  executiveFields,
  freeDeanAreas,
  listStaffOptions,
} from "@/lib/cms/resources/executives";

import { saveExecutive } from "../actions";

export const metadata: Metadata = { title: "Add executive" };

export default async function Page() {
  const [staff, rows, areas] = await Promise.all([
    listStaffOptions(),
    chartRows(),
    freeDeanAreas(),
  ]);
  // a role with room (and, for a Dean, an area still without one)
  const open = rows
    .filter((row) => !row.full && (row.level !== 2 || areas.length > 0))
    .map((row) => row.level);

  if (open.length === 0) {
    return (
      <>
        <PageHeader title="Add executive" />
        <Notice tone="warning" title="The chart is full" className="mb-5">
          It already has {rows.map((row) => `${row.limit} ${row.title}`).join(" and ")}. To add
          someone, delete the person they replace first, then add the new one.
        </Notice>
        <LinkButton href="/admin/executives" variant="secondary">
          Back to Executives
        </LinkButton>
      </>
    );
  }

  const position = await positionForm("executives", {
    label: "Position in row",
    help: "Left to right within their row of the chart.",
    groups: open.map(String),
    groupField: "level",
  });
  return (
    <>
      <PageHeader
        title="Add executive"
        description="Save as a draft to keep them off the Executives page until the details are ready."
      />
      <ResourceForm
        action={saveExecutive.bind(null, null)}
        fields={withPosition(executiveFields(staff, open, areas), position.fields)}
        initial={{
          values: { ...position.values, status: "draft", level: String(open[0]), staffId: "" },
          media: {},
        }}
        submitLabel="Create executive"
        cancelHref="/admin/executives"
      />
    </>
  );
}
