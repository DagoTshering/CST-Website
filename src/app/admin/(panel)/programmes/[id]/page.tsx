import { Plus, ListOrdered } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DataTable, ListNotice } from "@/components/admin/DataTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { Card, LinkButton, PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { listProgrammeParts } from "@/lib/cms/resources/programme-pages";
import {
  PROGRAMME_LEVELS,
  programmeFields,
  getProgrammeForm,
} from "@/lib/cms/resources/programmes";
import { listDepartmentOptions } from "@/lib/cms/resources/staff";
import { recordId } from "@/lib/cms/validation";

import { deleteProgrammeFacility, deleteModule, deleteProgramme, saveProgramme } from "../actions";

export const metadata: Metadata = { title: "Edit programme" };

/** A part of the programme's page (its modules or facilities), listed below the form. */
function Part({
  id,
  title,
  description,
  base,
  kind,
  count,
  children,
}: {
  id: string;
  title: string;
  description: string;
  base: string;
  kind: string;
  count: number;
  children: React.ReactNode;
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
        <div className="flex flex-wrap gap-2">
          {count > 1 && (
            <LinkButton href={`${base}/arrange`} variant="secondary">
              <ListOrdered aria-hidden="true" />
              Arrange order
            </LinkButton>
          )}
          <LinkButton href={`${base}/new`}>
            <Plus aria-hidden="true" />
            Add {kind}
          </LinkButton>
        </div>
      </div>
      {count === 0 ? (
        <Card>
          <p className="p-5 text-sm text-admin-muted">None yet.</p>
        </Card>
      ) : (
        children
      )}
    </section>
  );
}

export default async function Page({ params, searchParams }: PageProps<"/admin/programmes/[id]">) {
  const [{ id: rawId }, { notice, part }] = await Promise.all([params, searchParams]);
  const id = recordId.safeParse(rawId);
  if (!id.success) notFound();
  const initial = await getProgrammeForm(id.data);
  if (!initial) notFound();
  const [position, departments, { modules, facilities }] = await Promise.all([
    positionForm("programmes", {
      label: "Position",
      help: "Where it appears among the programmes of its level.",
      groups: PROGRAMME_LEVELS.map((level) => level.value),
      groupField: "level",
      current: { id: id.data, group: initial.values.level },
    }),
    listDepartmentOptions(),
    listProgrammeParts(id.data),
  ]);
  const name = initial.values.name;
  const base = `/admin/programmes/${id.data}`;

  return (
    <>
      <PageHeader
        title="Edit programme"
        description={name}
        actions={
          <DeleteButton
            action={deleteProgramme.bind(null, id.data)}
            itemName={name}
            kind="programme"
          />
        }
      />
      {part !== "module" && part !== "facility" && <ListNotice notice={notice} kind="programme" />}
      <ResourceForm
        action={saveProgramme.bind(null, id.data)}
        fields={withPosition(programmeFields(departments), position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/programmes"
      />

      <Part
        id="modules"
        title="Modules"
        description="The modules listed under Programme structure on the programme’s page; each opens to its description."
        base={`${base}/modules`}
        kind="module"
        count={modules.length}
      >
        {part === "module" && <ListNotice notice={notice} kind="module" />}
        <DataTable
          caption="Modules"
          rows={modules}
          kind="module"
          rowName={(row) => row.name}
          editHref={(row) => `${base}/modules/${row.id}`}
          deleteAction={(row) => deleteModule.bind(null, id.data, row.id)}
          columns={[
            { header: "Module", cell: (row) => row.name },
            { header: "Code", cell: (row) => row.code ?? "—", wide: true },
            {
              header: "Description",
              cell: (row) =>
                !row.description ? "—" : row.descriptionConfirmed ? "Confirmed" : "To confirm",
            },
          ]}
        />
      </Part>

      <Part
        id="facilities"
        title="Facilities"
        description="The laboratories and studios listed under Main facilities on the programme’s page."
        base={`${base}/facilities`}
        kind="facility"
        count={facilities.length}
      >
        {part === "facility" && <ListNotice notice={notice} kind="facility" />}
        <DataTable
          caption="Facilities"
          rows={facilities}
          kind="facility"
          rowName={(row) => row.name}
          editHref={(row) => `${base}/facilities/${row.id}`}
          deleteAction={(row) => deleteProgrammeFacility.bind(null, id.data, row.id)}
          columns={[
            { header: "Facility", cell: (row) => row.name },
            {
              header: "Description",
              cell: (row) => row.description ?? "—",
              wide: true,
              className: "text-admin-muted",
            },
          ]}
        />
      </Part>
    </>
  );
}
