import type { Metadata } from "next";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { leaderFields } from "@/lib/cms/resources/leaders";

import { saveLeader } from "../actions";

export const metadata: Metadata = { title: "Add profile" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add profile"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveLeader.bind(null, null)}
        fields={leaderFields}
        initial={{ values: { status: "draft", sortOrder: "0" }, media: {} }}
        submitLabel="Create leadership profile"
        cancelHref="/admin/leadership"
      />
    </>
  );
}
