import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { nameFields } from "@/lib/cms/resources/about-page";

import { saveCollegeName } from "../../actions";

export const metadata: Metadata = { title: "Add name" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add name"
        description="A name the college has had, for the About page’s timeline."
      />
      <ResourceForm
        action={saveCollegeName.bind(null, null)}
        fields={nameFields}
        initial={{ values: {}, media: {} }}
        submitLabel="Add name"
        cancelHref="/admin/about-page#names"
      />
    </>
  );
}
