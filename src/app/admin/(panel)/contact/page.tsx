import { ExternalLink, ListOrdered, Plus } from "lucide-react";
import type { Metadata } from "next";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { FormPart } from "@/components/admin/FormPart";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { LinkButton, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import {
  contactSettingsFields,
  getContactSettingsForm,
  listContactParts,
} from "@/lib/cms/resources/contact";

import { deleteContactOffice, deleteContactSocial, saveContactSettings } from "./actions";

export const metadata: Metadata = { title: "Contact page" };

export default async function Page({ searchParams }: PageProps<"/admin/contact">) {
  const [{ notice, part }, initial, { offices, social }] = await Promise.all([
    searchParams,
    getContactSettingsForm(),
    listContactParts(),
  ]);

  return (
    <>
      <PageHeader
        title="Contact page"
        description="The Contact page (/contact): its banner, address, office hours, main phone and email, the map, the offices of its directory and the college's pages elsewhere online."
        actions={
          <LinkButton href="/contact" variant="secondary">
            <ExternalLink aria-hidden="true" />
            View page
          </LinkButton>
        }
      />
      {!part && <ListNotice notice={notice} kind="page" />}
      {!initial && (
        <Notice tone="info" className="mb-5">
          The Contact page has not been set up yet, so the website shows a short notice in its
          place. Fill in the form below and save it.
        </Notice>
      )}
      <ResourceForm
        action={saveContactSettings}
        fields={contactSettingsFields}
        initial={initial ?? { values: { openDays: "1,2,3,4,5" }, media: {} }}
        submitLabel={initial ? "Save changes" : "Create page"}
      />

      <FormPart
        id="offices"
        title="Who to contact"
        description="The directory, in this order. An office with an email can be chosen in the message box. Drafts are not shown."
        empty={offices.length === 0}
        actions={
          <>
            {offices.length > 1 && (
              <LinkButton href="/admin/contact/offices/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/contact/offices/new">
              <Plus aria-hidden="true" />
              Add office
            </LinkButton>
          </>
        }
      >
        {part === "office" && <ListNotice notice={notice} kind="office" />}
        <DataTable
          caption="Offices"
          rows={offices}
          kind="office"
          rowName={(row) => row.name}
          editHref={(row) => `/admin/contact/offices/${row.id}`}
          deleteAction={(row) => deleteContactOffice.bind(null, row.id)}
          columns={[
            { header: "Office", cell: (row) => row.name },
            {
              header: "Email",
              cell: (row) => row.email ?? "—",
              wide: true,
              className: "break-all text-admin-muted",
            },
            {
              header: "Phone",
              cell: (row) => row.phone ?? "—",
              wide: true,
              className: "whitespace-nowrap text-admin-muted",
            },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </FormPart>

      <FormPart
        id="online"
        title="Find us online"
        description="The college's pages on other sites, in this order. Drafts are not shown."
        empty={social.length === 0}
        actions={
          <>
            {social.length > 1 && (
              <LinkButton href="/admin/contact/online/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/contact/online/new">
              <Plus aria-hidden="true" />
              Add link
            </LinkButton>
          </>
        }
      >
        {part === "link" && <ListNotice notice={notice} kind="link" />}
        <DataTable
          caption="Find us online"
          rows={social}
          kind="link"
          rowName={(row) => row.label}
          editHref={(row) => `/admin/contact/online/${row.id}`}
          deleteAction={(row) => deleteContactSocial.bind(null, row.id)}
          columns={[
            { header: "Name", cell: (row) => row.label },
            {
              header: "Link",
              cell: (row) => row.url,
              wide: true,
              className: "break-all text-admin-muted",
            },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </FormPart>
    </>
  );
}
