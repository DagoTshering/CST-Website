import { ExternalLink, Eye, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import s from "@/components/announcements/NoticeBoard.module.css";
import { NoticeSheet } from "@/components/announcements/NoticeSheet";
import { LinkButton, Notice, StatusBadge } from "@/components/admin/ui";
import { getAnnouncementPreview } from "@/lib/cms/resources/announcements";
import { recordId } from "@/lib/cms/validation";

export const metadata: Metadata = { title: "Preview announcement", robots: { index: false } };

/**
 * A notice as it is saved, drawn exactly as its public page draws it. The link can be shared with
 * other administrators: like every admin page, it needs a signed-in administrator.
 */
export default async function Page({ params }: PageProps<"/admin/announcements/[id]/preview">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const notice = await getAnnouncementPreview(id.data);
  if (!notice) notFound();
  const published = notice.status === "published";

  return (
    <>
      <Notice tone="info" className="mb-6">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Eye className="size-4" aria-hidden="true" />
          <span className="font-medium">Preview of the saved announcement</span>
          <StatusBadge status={notice.status} />
          <span>
            {published
              ? "This is what visitors see."
              : "This draft is not on the website: only signed-in administrators can open this link."}
          </span>
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          <LinkButton href={`/admin/announcements/${id.data}`} variant="secondary">
            <Pencil aria-hidden="true" />
            Back to editing
          </LinkButton>
          {published && (
            <LinkButton href={`/announcements/${notice.slug}`} variant="secondary">
              <ExternalLink aria-hidden="true" />
              Open the public page
            </LinkButton>
          )}
        </span>
      </Notice>
      <div className={`overflow-hidden rounded-lg border border-admin-line bg-white ${s.page}`}>
        <NoticeSheet
          notice={notice}
          backHref={`/admin/announcements/${id.data}`}
          backLabel="Back to editing"
        />
      </div>
    </>
  );
}
