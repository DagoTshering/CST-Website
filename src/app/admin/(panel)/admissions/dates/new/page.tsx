import type { Metadata } from "next";
import Link from "next/link";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { LinkButton, Notice, PageHeader } from "@/components/admin/ui";
import { listStepChoices, stepFields } from "@/lib/cms/resources/admission";

import { saveAdmissionStep } from "../../actions";

export const metadata: Metadata = { title: "Add date" };

export default async function Page() {
  const steps = await listStepChoices(null);
  return (
    <>
      <PageHeader
        title="Add date"
        description="The date of a step of the intake, for the Important dates. Each step is dated once."
        actions={
          <LinkButton href="/admin/admissions/steps" variant="secondary">
            Manage steps
          </LinkButton>
        }
      />
      {steps.length === 0 ? (
        <Notice tone="info">
          Every step already has a date. Add a step under{" "}
          <Link href="/admin/admissions/steps" className="font-medium underline underline-offset-2">
            Steps
          </Link>{" "}
          first, or edit an existing date.
        </Notice>
      ) : (
        <ResourceForm
          action={saveAdmissionStep.bind(null, null)}
          fields={stepFields(steps)}
          initial={{ values: { stepTypeId: "" }, media: {} }}
          submitLabel="Add date"
          cancelHref="/admin/admissions#dates"
        />
      )}
    </>
  );
}
