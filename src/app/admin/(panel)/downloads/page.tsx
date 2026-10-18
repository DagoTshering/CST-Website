import { FileDown, FolderCog, Link2, Plus, ListOrdered } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import {
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { listCategoryOptions, listDownloads } from "@/lib/cms/resources/downloads";
import { cx } from "@/lib/cx";

import { deleteDownload } from "./actions";

export const metadata: Metadata = { title: "Downloads" };

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default async function Page({ searchParams }: PageProps<"/admin/downloads">) {
  const [{ notice, category }, all, categories] = await Promise.all([
    searchParams,
    listDownloads(),
    listCategoryOptions(),
  ]);
  const selected = categories.find((c) => String(c.id) === category) ?? null;
  const rows = selected ? all.filter((row) => row.categoryId === selected.id) : all;

  const addButton = (
    <LinkButton href="/admin/downloads/new">
      <Plus aria-hidden="true" />
      Add download
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Downloads"
        description="Forms, guidelines and publications on the Downloads page, by category. A download is a PDF file or a link, such as a Google Drive folder."
        actions={
          <>
            {rows.length > 1 && (
              <LinkButton
                href={`/admin/downloads/arrange${selected ? `?category=${selected.id}` : ""}`}
                variant="secondary"
              >
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/downloads/categories" variant="secondary">
              <FolderCog aria-hidden="true" />
              Categories
            </LinkButton>
            {categories.length > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={notice} kind="download" />

      {categories.length > 0 && (
        <nav aria-label="Filter by category" className="mb-5 flex flex-wrap gap-2">
          {[{ id: null, name: "All" }, ...categories].map((c) => {
            const active = selected ? c.id === selected.id : c.id === null;
            const n = c.id === null ? all.length : all.filter((r) => r.categoryId === c.id).length;
            return (
              <Link
                key={c.id ?? "all"}
                href={c.id === null ? "/admin/downloads" : `/admin/downloads?category=${c.id}`}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  active
                    ? "border-admin-navy bg-admin-navy text-white"
                    : "border-admin-line bg-white text-admin-navy hover:border-admin-accent",
                )}
              >
                {c.name} <span className={active ? "text-white/70" : "text-admin-muted"}>{n}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderCog}
            title="No categories yet"
            action={
              <LinkButton href="/admin/downloads/categories/new">
                <Plus aria-hidden="true" />
                Add category
              </LinkButton>
            }
          >
            Downloads are listed by category. Create a category first.
          </EmptyState>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={FileDown} title="No downloads yet" action={addButton}>
            Add a PDF or a link to list it on the Downloads page.
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption="Downloads"
          rows={rows}
          kind="download"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/downloads/${row.id}`}
          deleteAction={(row) => deleteDownload.bind(null, row.id)}
          columns={[
            {
              header: "Title",
              cell: (row) => (
                <span className="block">
                  {row.title}
                  {row.group && (
                    <span className="block text-xs font-normal text-admin-muted">{row.group}</span>
                  )}
                </span>
              ),
            },
            { header: "Category", cell: (row) => row.category, wide: true },
            {
              header: "Type",
              cell: (row) =>
                row.kind === "file" ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-admin-muted">
                    <FileDown className="size-3.5" aria-hidden="true" />
                    PDF{row.byteSize ? ` · ${megabytes(row.byteSize)}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-admin-muted">
                    <Link2 className="size-3.5" aria-hidden="true" />
                    Link
                  </span>
                ),
            },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
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
