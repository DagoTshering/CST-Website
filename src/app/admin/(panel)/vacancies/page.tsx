import { BriefcaseBusiness, FileText, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import {
  buttonClass,
  Card,
  EmptyState,
  formatDateTime,
  LinkButton,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { countVacancies, listVacancies } from "@/lib/cms/resources/vacancies";
import { formatVacancyDate, VACANCY_CATEGORIES, vacancyCategoryLabel } from "@/lib/vacancies";

import { deleteVacancy } from "./actions";

export const metadata: Metadata = { title: "Vacancies" };

const control =
  "block w-full rounded-md border border-admin-line bg-white px-3 py-2 text-sm text-admin-navy shadow-xs focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/20 focus:outline-none";

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value.slice(0, 100) : "";

export default async function Page({ searchParams }: PageProps<"/admin/vacancies">) {
  const params = await searchParams;
  const filter = {
    query: one(params.q),
    category: one(params.category),
    status: one(params.status),
  };
  const filtering = Boolean(filter.query || filter.category || filter.status);
  const [rows, total] = await Promise.all([listVacancies(filter), countVacancies()]);
  const addButton = (
    <LinkButton href="/admin/vacancies/new">
      <Plus aria-hidden="true" />
      Add vacancy post
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title="Vacancies"
        description="Job recruitment notices on the Vacancies page (/vacancies): vacancies, shortlists, interview and examination schedules, results and selections. Drafts are not shown on the website. General college notices are under Announcements."
        actions={
          <>
            <LinkButton href="/vacancies" variant="secondary">
              View page
            </LinkButton>
            {total > 0 && addButton}
          </>
        }
      />
      <ListNotice notice={params.notice} kind="vacancy post" />

      {total > 0 && (
        <form
          action="/admin/vacancies"
          role="search"
          className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <div>
            <label
              htmlFor="vacancy-search"
              className="mb-1 block text-xs font-medium text-admin-muted"
            >
              Title
            </label>
            <input
              id="vacancy-search"
              type="search"
              name="q"
              defaultValue={filter.query}
              placeholder="Search by title"
              className={control}
            />
          </div>
          <div>
            <label
              htmlFor="vacancy-category"
              className="mb-1 block text-xs font-medium text-admin-muted"
            >
              Category
            </label>
            <select
              id="vacancy-category"
              name="category"
              defaultValue={filter.category}
              className={control}
            >
              <option value="">All categories</option>
              {VACANCY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="vacancy-status"
              className="mb-1 block text-xs font-medium text-admin-muted"
            >
              Status
            </label>
            <select
              id="vacancy-status"
              name="status"
              defaultValue={filter.status}
              className={control}
            >
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass("secondary")}>
              <Search aria-hidden="true" />
              Filter
            </button>
            {filtering && (
              <Link href="/admin/vacancies" className={buttonClass("ghost")}>
                Clear
              </Link>
            )}
          </div>
        </form>
      )}

      {total === 0 ? (
        <Card>
          <EmptyState icon={BriefcaseBusiness} title="No vacancy posts yet" action={addButton}>
            Add a job vacancy, a shortlist, an interview schedule or a recruitment result.
          </EmptyState>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="Nothing matches">
            No post matches this search and these filters.{" "}
            <Link
              href="/admin/vacancies"
              className="font-medium text-admin-accent-strong underline"
            >
              Show all posts
            </Link>
            .
          </EmptyState>
        </Card>
      ) : (
        <DataTable
          caption={
            filtering ? `Vacancy posts matching the filters (${rows.length})` : "Vacancy posts"
          }
          rows={rows}
          kind="vacancy post"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/vacancies/${row.id}`}
          deleteAction={(row) => deleteVacancy.bind(null, row.id)}
          columns={[
            {
              header: "Title",
              cell: (row) => (
                <span className="flex items-start gap-2">
                  <span>{row.title}</span>
                  {row.hasAttachment && (
                    <FileText
                      className="mt-0.5 size-4 shrink-0 text-admin-muted"
                      aria-label="With a PDF"
                    />
                  )}
                </span>
              ),
            },
            { header: "Category", cell: (row) => vacancyCategoryLabel(row.category), wide: true },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            {
              header: "Published",
              cell: (row) => (row.publishedAt ? formatVacancyDate(row.publishedAt) : "—"),
              wide: true,
              className: "whitespace-nowrap",
            },
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
