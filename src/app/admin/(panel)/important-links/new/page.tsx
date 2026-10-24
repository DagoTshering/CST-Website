import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { positionForm, withPosition } from "@/lib/cms/ordering";
import { importantLinkFields } from "@/lib/cms/resources/important-links";

import { saveImportantLink } from "../actions";

export const metadata: Metadata = { title: "Add link" };

export default async function Page() {
  await requireAdmin();
  const position = await positionForm("importantLinks", {
    label: "Position",
    help: "Where the link appears in the menu.",
  });
  return (
    <>
      <PageHeader title="Add link" description="A new link under Others › Important Links." />
      <ResourceForm
        action={saveImportantLink.bind(null, null)}
        fields={withPosition(importantLinkFields, position.fields)}
        initial={{ values: { ...position.values, status: "published" }, media: {} }}
        submitLabel="Create link"
        cancelHref="/admin/important-links"
      />
    </>
  );
}
