import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { faqFields, getFaqForm } from "@/lib/cms/resources/admission";
import { recordId } from "@/lib/cms/validation";

import { deleteAdmissionFaq, saveAdmissionFaq } from "../../actions";

export const metadata: Metadata = { title: "Edit question" };

export default async function Page({ params }: PageProps<"/admin/admissions/faq/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getFaqForm(id.data);
  if (!initial) notFound();
  const position = await positionForm("admissionFaqs", {
    label: "Position",
    help: "Where it appears among the questions.",
    current: { id: id.data, group: "all" },
  });
  const name = initial.values.question;

  return (
    <>
      <PageHeader
        title="Edit question"
        description={name}
        actions={
          <DeleteButton
            action={deleteAdmissionFaq.bind(null, id.data)}
            itemName={name}
            kind="question"
          />
        }
      />
      <ResourceForm
        action={saveAdmissionFaq.bind(null, id.data)}
        fields={withPosition(faqFields, position.fields)}
        initial={{ ...initial, values: { ...initial.values, ...position.values } }}
        submitLabel="Save changes"
        cancelHref="/admin/admissions#faq"
      />
    </>
  );
}
