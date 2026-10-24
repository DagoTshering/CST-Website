import type { Metadata } from "next";
import { connection } from "next/server";

import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { EMPTY_DOCUMENT } from "@/lib/rich-text";

import { createAnnouncement } from "../actions";

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
        description="A general college notice, for the homepage and the Announcements page. Job recruitment notices go under Vacancies."
      />
      <AnnouncementForm
        action={createAnnouncement}
        initial={{
          id: null,
          oldSlugs: [],
          values: { title: "", publishedOn: todayInBhutan(), slug: "" },
          attachment: null,
          content: EMPTY_DOCUMENT,
          status: "draft",
          publishedAt: null,
          slug: null,
        }}
        cancelHref="/admin/announcements"
      />
    </>
  );
}
