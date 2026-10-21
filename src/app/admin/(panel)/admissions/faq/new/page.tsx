import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { faqFields } from "@/lib/cms/resources/admission";

import { saveAdmissionFaq } from "../../actions";

export const metadata: Metadata = { title: "Add question" };

export default async function Page() {
  const position = await positionForm("admissionFaqs", {
    label: "Position",
    help: "Where it appears among the questions.",
  });
  return (
    <>
      <PageHeader
        title="Add question"
        description="Save as a draft to keep it off the Admissions page until it is ready."
      />
      <ResourceForm
        action={saveAdmissionFaq.bind(null, null)}
        fields={withPosition(faqFields, position.fields)}
        initial={{ values: { ...position.values, status: "draft" }, media: {} }}
        submitLabel="Add question"
        cancelHref="/admin/admissions#faq"
      />
    </>
  );
}
