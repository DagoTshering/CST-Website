import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/ui";
import { VacancyForm } from "@/components/admin/VacancyForm";
import { getVacancyForm } from "@/lib/cms/resources/vacancies";
import { recordId } from "@/lib/cms/validation";

import { deleteVacancy, updateVacancy } from "../actions";

export const metadata: Metadata = { title: "Edit vacancy post" };

export default async function Page({ params }: PageProps<"/admin/vacancies/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getVacancyForm(id.data);
  if (!initial) notFound();
  const title = initial.values.title;

  return (
    <>
      <PageHeader
        title="Edit vacancy post"
        description={title}
        actions={
          <DeleteButton
            action={deleteVacancy.bind(null, id.data)}
            itemName={title}
            kind="vacancy post"
          />
        }
      />
      <VacancyForm
        action={updateVacancy.bind(null, id.data)}
        initial={{
          id: id.data,
          oldSlugs: initial.oldSlugs,
          values: initial.values,
          attachment: initial.media.attachmentId ?? null,
          content: initial.content,
          status: initial.status,
          publishedAt: initial.publishedAt?.toISOString() ?? null,
          slug: initial.slug,
        }}
        cancelHref="/admin/vacancies"
      />
    </>
  );
}
