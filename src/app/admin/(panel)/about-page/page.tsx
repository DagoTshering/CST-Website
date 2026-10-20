import { ExternalLink, ListOrdered, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { DataTable, ListNotice, TitleWithThumb } from "@/components/admin/DataTable";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { Card, LinkButton, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import {
  CENTRE_GROUPS,
  getPageForm,
  listAboutParts,
  pageFields,
} from "@/lib/cms/resources/about-page";

import { deleteCentre, deleteCollegeName, saveAboutPage } from "./actions";

export const metadata: Metadata = { title: "About Page" };

/** A list below the form (the names, the centres), with its own buttons. */
function Part({
  id,
  title,
  description,
  actions,
  empty,
  children,
}: {
  id: string;
  title: string;
  description: string;
  actions: ReactNode;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-10 scroll-mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-lg font-semibold text-admin-ink">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-admin-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {empty ? (
        <Card>
          <p className="p-5 text-sm text-admin-muted">None yet.</p>
        </Card>
      ) : (
        children
      )}
    </section>
  );
}

const groupLabel = (group: string) => CENTRE_GROUPS.find((g) => g.value === group)?.label ?? group;

export default async function Page({ searchParams }: PageProps<"/admin/about-page">) {
  const [{ notice, part }, initial, { names, centres }] = await Promise.all([
    searchParams,
    getPageForm(),
    listAboutParts(),
  ]);
  const arrangeable = CENTRE_GROUPS.filter(
    (g) => centres.filter((c) => c.group === g.value).length > 1,
  );

  return (
    <>
      <PageHeader
        title="About Page"
        description={
          <>
            The About page of the website (/about): the college, its names over the years, the
            vision, what it offers and its research and innovation centres. The short About section
            on the homepage is edited under{" "}
            <Link
              href="/admin/about"
              className="font-medium text-admin-accent-strong underline underline-offset-2"
            >
              Homepage About
            </Link>
            .
          </>
        }
        actions={
          <LinkButton href="/about" variant="secondary">
            <ExternalLink aria-hidden="true" />
            View page
          </LinkButton>
        }
      />
      {part !== "name" && part !== "centre" && <ListNotice notice={notice} kind="page" />}
      {!initial && (
        <Notice tone="info" className="mb-5">
          The About page has not been written yet, so the website shows a short notice in its place.
          Fill in the form below and save it.
        </Notice>
      )}
      <ResourceForm
        action={saveAboutPage}
        fields={pageFields}
        initial={initial ?? { values: {}, media: {} }}
        submitLabel={initial ? "Save changes" : "Create page"}
      />

      <Part
        id="names"
        title="Names through the years"
        description="The college’s names on the page’s timeline, always in order of year."
        empty={names.length === 0}
        actions={
          <LinkButton href="/admin/about-page/names/new">
            <Plus aria-hidden="true" />
            Add name
          </LinkButton>
        }
      >
        {part === "name" && <ListNotice notice={notice} kind="name" />}
        <DataTable
          caption="Names through the years"
          rows={names}
          kind="name"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/about-page/names/${row.id}`}
          deleteAction={(row) => deleteCollegeName.bind(null, row.id)}
          columns={[
            { header: "Year", cell: (row) => row.year },
            {
              header: "Name",
              cell: (row) => <TitleWithThumb title={row.name} image={row.image} />,
            },
            { header: "Note", cell: (row) => row.note ?? "—", wide: true },
          ]}
        />
      </Part>

      <Part
        id="centres"
        title="Research and innovation centres"
        description="Listed in two groups on the page, research centres first. Drafts are not shown."
        empty={centres.length === 0}
        actions={
          <>
            {arrangeable.map((g) => (
              <LinkButton
                key={g.value}
                href={`/admin/about-page/centres/arrange?group=${g.value}`}
                variant="secondary"
              >
                <ListOrdered aria-hidden="true" />
                Arrange {g.value === "research" ? "research" : "innovation"}
              </LinkButton>
            ))}
            <LinkButton href="/admin/about-page/centres/new">
              <Plus aria-hidden="true" />
              Add centre
            </LinkButton>
          </>
        }
      >
        {part === "centre" && <ListNotice notice={notice} kind="centre" />}
        <DataTable
          caption="Research and innovation centres"
          rows={centres}
          kind="centre"
          rowName={(row) => row.acronym}
          editHref={(row) => `/admin/about-page/centres/${row.id}`}
          deleteAction={(row) => deleteCentre.bind(null, row.id)}
          columns={[
            {
              header: "Centre",
              cell: (row) => <TitleWithThumb title={row.acronym} image={row.image} />,
            },
            { header: "Kind", cell: (row) => groupLabel(row.group) },
            { header: "Full name", cell: (row) => row.fullName ?? "—", wide: true },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </Part>
    </>
  );
}
