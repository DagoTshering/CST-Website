import { ExternalLink, Eye, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LinkButton, Notice, StatusBadge } from "@/components/admin/ui";
import { VacancyArticle } from "@/components/vacancy/VacancyArticle";
import { getVacancyPreview } from "@/lib/cms/resources/vacancies";
import { recordId } from "@/lib/cms/validation";

export const metadata: Metadata = { title: "Preview vacancy post", robots: { index: false } };

/**
 * A post as it is saved, drawn exactly as the public page draws it, for checking a draft (or a
 * published post) before or after publishing. The link can be shared with other administrators:
 * like every admin page, it needs a signed-in administrator, so a draft never becomes public.
 */
export default async function Page({ params }: PageProps<"/admin/vacancies/[id]/preview">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const post = await getVacancyPreview(id.data);
  if (!post) notFound();
  const published = post.status === "published";

  return (
    <>
      <Notice tone="info" className="mb-6">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Eye className="size-4" aria-hidden="true" />
          <span className="font-medium">Preview of the saved post</span>
          <StatusBadge status={post.status} />
          <span>
            {published
              ? "This is what visitors see."
              : "This draft is not on the website: only signed-in administrators can open this link."}
          </span>
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          <LinkButton href={`/admin/vacancies/${id.data}`} variant="secondary">
            <Pencil aria-hidden="true" />
            Back to editing
          </LinkButton>
          {published && (
            <LinkButton href={`/vacancies/${post.slug}`} variant="secondary">
              <ExternalLink aria-hidden="true" />
              Open the public page
            </LinkButton>
          )}
        </span>
      </Notice>
      <div className="overflow-hidden rounded-lg border border-admin-line bg-white">
        <VacancyArticle
          post={post}
          backHref={`/admin/vacancies/${id.data}`}
          backLabel="Back to editing"
        />
      </div>
    </>
  );
}
