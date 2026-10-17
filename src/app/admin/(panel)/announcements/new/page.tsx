import type { Metadata } from "next";
import { connection } from "next/server";

import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { announcementFields } from "@/lib/cms/resources/announcements";

import { saveAnnouncement } from "../actions";

export const metadata: Metadata = { title: "New announcement" };

/** Today's date in Bhutan, as YYYY-MM-DD. */
const todayInBhutan = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Thimphu" }).format(new Date());

export default async function Page() {
  await requireAdmin();
  await connection(); // the default date is today's, so this renders at request time
  return (
    <>
      <PageHeader
        title="New announcement"
        description="Save as a draft to keep it off the public website until it is ready."
      />
      <ResourceForm
        action={saveAnnouncement.bind(null, null)}
        fields={announcementFields}
        initial={{ values: { status: "draft", publishedOn: todayInBhutan() }, media: {} }}
        submitLabel="Create announcement"
        cancelHref="/admin/announcements"
      />
    </>
  );
}
