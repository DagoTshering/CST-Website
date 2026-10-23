import type { Metadata } from "next";

import { VacancyForm } from "@/components/admin/VacancyForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { EMPTY_DOCUMENT } from "@/lib/rich-text";

import { createVacancy } from "../actions";

export const metadata: Metadata = { title: "Add vacancy post" };

export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Add vacancy post"
        description="A job recruitment notice: a vacancy, a shortlist, an interview or examination schedule, a result or a selection. General college notices go under Announcements."
      />
      <VacancyForm
        action={createVacancy}
        initial={{
          id: null,
          oldSlugs: [],
          values: { title: "", category: "", slug: "" },
          attachment: null,
          content: EMPTY_DOCUMENT,
          status: "draft",
          publishedAt: null,
          slug: null,
        }}
        cancelHref="/admin/vacancies"
      />
    </>
  );
}
