import { ListOrdered, ListTodo, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/admin/ui";
import { dateRangeLabel } from "@/lib/admission";
import { listStepTypes } from "@/lib/cms/resources/admission";

import { deleteAdmissionStepType } from "../actions";

export const metadata: Metadata = { title: "Steps" };

const MARK = { opens: "Opens applications", closes: "Closes applications" } as const;

export default async function Page({ searchParams }: PageProps<"/admin/admissions/steps">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listStepTypes()]);
  const addButton = (
    <LinkButton href="/admin/admissions/steps/new">
      <Plus aria-hidden="true" />
      Add step
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Steps"
        description="The steps an intake goes through, offered when an important date is added. Mark the step that opens applications and the one that closes them: their dates set the Admissions page’s state. A step with a date cannot be deleted."
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton href="/admin/admissions/steps/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {rows.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="step" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={ListTodo} title="No steps yet" action={addButton}>
            Add the steps of an intake, such as Applications open.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Steps"
          rows={rows}
          kind="step"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/admissions/steps/${row.id}`}
          deleteAction={(row) => deleteAdmissionStepType.bind(null, row.id)}
          columns={[
            { header: "Step", cell: (row) => row.name },
            { header: "Application window", cell: (row) => (row.mark ? MARK[row.mark] : "—") },
            {
              header: "Date",
              cell: (row) =>
                row.startDate && row.endDate
                  ? dateRangeLabel(row.startDate, row.endDate)
                  : "No date",
              wide: true,
              className: "whitespace-nowrap text-admin-muted",
            },
          ]}
        />
      )}
    </>
  );
}
