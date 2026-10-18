import { FolderCog, Plus, ListOrdered } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { Card, EmptyState, formatDateTime, LinkButton, PageHeader } from "@/components/admin/ui";
import { listCategories } from "@/lib/cms/resources/downloads";

import { deleteCategory } from "../actions";

export const metadata: Metadata = { title: "Download categories" };

export default async function Page({ searchParams }: PageProps<"/admin/downloads/categories">) {
  const [{ notice }, rows] = await Promise.all([searchParams, listCategories()]);
  const addButton = (
    <LinkButton href="/admin/downloads/categories/new">
      <Plus aria-hidden="true" />
      Add category
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Download categories"
        description="The sections of the Downloads page, in display order. A category can be deleted once it has no downloads."
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton href="/admin/downloads/categories/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            {rows.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="category" />
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={FolderCog} title="No categories yet" action={addButton}>
            Create a category, then add downloads to it.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Download categories"
          rows={rows}
          kind="category"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/downloads/categories/${row.id}`}
          deleteAction={(row) => deleteCategory.bind(null, row.id)}
          columns={[
            { header: "Name", cell: (row) => row.name },
            {
              header: "Grouped by",
              cell: (row) => (row.groupByProgramme ? "Programme" : "Heading"),
              wide: true,
            },
            { header: "Downloads", cell: (row) => row.downloads },
            {
              header: "Last updated",
              cell: (row) => formatDateTime(row.updatedAt),
              wide: true,
              className: "whitespace-nowrap text-admin-muted",
            },
          ]}
        />
      )}
    </>
  );
}
