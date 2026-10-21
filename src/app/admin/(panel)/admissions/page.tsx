import { ExternalLink, ListOrdered, ListTodo, Plus } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { FormPart } from "@/components/admin/FormPart";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { LinkButton, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import {
  admissionStatus,
  bhutanToday,
  dateRangeLabel,
  type AdmissionStatus,
} from "@/lib/admission";
import { getSettingsForm, listAdmissionParts, settingsFields } from "@/lib/cms/resources/admission";

import {
  deleteAdmissionFaq,
  deleteAdmissionStep,
  deleteAdmissionTrack,
  saveAdmissionSettings,
} from "./actions";

export const metadata: Metadata = { title: "Admissions" };

const STATE: Record<AdmissionStatus, { label: string; tone: "success" | "warning" | "info" }> = {
  upcoming: { label: "upcoming (opening soon)", tone: "warning" },
  open: { label: "open", tone: "success" },
  closed: { label: "closed", tone: "info" },
};

const MARK = { opens: "Opens applications", closes: "Closes applications" } as const;

export default async function Page({ searchParams }: PageProps<"/admin/admissions">) {
  const [{ notice, part }, initial, { steps, tracks, faqs }] = await Promise.all([
    searchParams,
    getSettingsForm(),
    listAdmissionParts(),
  ]);

  // what the page shows today, and why
  const override = (initial?.values.statusOverride || null) as AdmissionStatus | null;
  // today's date is read for this request, never while the page could be prerendered
  await connection();
  const today = bhutanToday();
  const status = admissionStatus(
    steps.map((s) => ({ title: s.title, start: s.startDate, end: s.endDate, mark: s.mark })),
    override,
    today,
  );
  const missing = (["opens", "closes"] as const).filter((m) => !steps.some((s) => s.mark === m));

  return (
    <>
      <PageHeader
        title="Admissions"
        description="The Admission for new students page (/admissions): its intake and dates, who can apply, the requirements, the documents, the questions and answers, and the admissions office."
        actions={
          <LinkButton href="/admissions" variant="secondary">
            <ExternalLink aria-hidden="true" />
            View page
          </LinkButton>
        }
      />
      {!part && <ListNotice notice={notice} kind="page" />}
      {initial ? (
        <Notice tone={STATE[status].tone} className="mb-5">
          Today ({dateRangeLabel(today, today)}) the page shows applications as{" "}
          <strong>{STATE[status].label}</strong>
          {override
            ? ", pinned by the State setting below."
            : steps.length === 0
              ? ": there are no important dates yet."
              : ", following the important dates."}
          {!override && steps.length > 0 && missing.length > 0 && (
            <>
              {" "}
              No dated step {missing
                .map((m) => (m === "opens" ? "opens" : "closes"))
                .join(" or ")}{" "}
              applications (see Steps), so the first date stands in for it.
            </>
          )}
        </Notice>
      ) : (
        <Notice tone="info" className="mb-5">
          The Admissions page has not been set up yet, so the website shows a short notice in its
          place. Fill in the form below and save it.
        </Notice>
      )}
      <ResourceForm
        action={saveAdmissionSettings}
        fields={settingsFields}
        initial={initial ?? { values: { statusOverride: "" }, media: {} }}
        submitLabel={initial ? "Save changes" : "Create page"}
      />

      <FormPart
        id="dates"
        title="Important dates"
        description="A date for each step of the intake, always shown in order of date. The steps themselves, and which opens and closes applications, are managed under Steps."
        empty={steps.length === 0}
        actions={
          <>
            <LinkButton href="/admin/admissions/steps" variant="secondary">
              <ListTodo aria-hidden="true" />
              Steps
            </LinkButton>
            <LinkButton href="/admin/admissions/dates/new">
              <Plus aria-hidden="true" />
              Add date
            </LinkButton>
          </>
        }
      >
        {part === "date" && <ListNotice notice={notice} kind="date" />}
        <DataTable
          caption="Important dates"
          rows={steps}
          kind="date"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/admissions/dates/${row.id}`}
          deleteAction={(row) => deleteAdmissionStep.bind(null, row.id)}
          columns={[
            {
              header: "Date",
              cell: (row) => dateRangeLabel(row.startDate, row.endDate),
              className: "whitespace-nowrap",
            },
            { header: "Step", cell: (row) => row.title },
            { header: "Window", cell: (row) => (row.mark ? MARK[row.mark] : "—"), wide: true },
          ]}
        />
      </FormPart>

      <FormPart
        id="requirements"
        title="Entry requirements"
        description="One set of tables per kind of programme, each with the programmes it applies to. The programmes listed on the page are the ones chosen here."
        empty={tracks.length === 0}
        actions={
          <>
            {tracks.length > 1 && (
              <LinkButton href="/admin/admissions/requirements/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/admissions/requirements/new">
              <Plus aria-hidden="true" />
              Add requirements
            </LinkButton>
          </>
        }
      >
        {part === "requirements" && <ListNotice notice={notice} kind="requirements" />}
        <DataTable
          caption="Entry requirements"
          rows={tracks}
          kind="requirements"
          rowName={(row) => row.title}
          editHref={(row) => `/admin/admissions/requirements/${row.id}`}
          deleteAction={(row) => deleteAdmissionTrack.bind(null, row.id)}
          columns={[
            { header: "Kind", cell: (row) => row.title },
            { header: "Selection test", cell: (row) => row.testType },
            {
              header: "Programmes",
              cell: (row) => (row.programmes.length === 0 ? "None" : row.programmes.join(", ")),
              wide: true,
              className: "text-admin-muted",
            },
          ]}
        />
      </FormPart>

      <FormPart
        id="faq"
        title="Questions and answers"
        description="Shown in this order. Drafts are not shown."
        empty={faqs.length === 0}
        actions={
          <>
            {faqs.length > 1 && (
              <LinkButton href="/admin/admissions/faq/arrange" variant="secondary">
                <ListOrdered aria-hidden="true" />
                Arrange order
              </LinkButton>
            )}
            <LinkButton href="/admin/admissions/faq/new">
              <Plus aria-hidden="true" />
              Add question
            </LinkButton>
          </>
        }
      >
        {part === "question" && <ListNotice notice={notice} kind="question" />}
        <DataTable
          caption="Questions and answers"
          rows={faqs}
          kind="question"
          rowName={(row) => row.question}
          editHref={(row) => `/admin/admissions/faq/${row.id}`}
          deleteAction={(row) => deleteAdmissionFaq.bind(null, row.id)}
          columns={[
            { header: "Question", cell: (row) => row.question },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
        />
      </FormPart>
    </>
  );
}
