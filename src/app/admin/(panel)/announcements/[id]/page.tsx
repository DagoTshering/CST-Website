import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/ui";
import { getAnnouncementForm } from "@/lib/cms/resources/announcements";
import { recordId } from "@/lib/cms/validation";

import { deleteAnnouncement, updateAnnouncement } from "../actions";

export const metadata: Metadata = { title: "Edit announcement" };

export default async function Page({ params }: PageProps<"/admin/announcements/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getAnnouncementForm(id.data);
  if (!initial) notFound();
  const name = initial.values.title;

  return (
    <>
      <PageHeader
        title="Edit announcement"
        description={name}
        actions={
          <DeleteButton
            action={deleteAnnouncement.bind(null, id.data)}
            itemName={name}
            kind="announcement"
          />
        }
      />
      <AnnouncementForm
        action={updateAnnouncement.bind(null, id.data)}
        initial={{
          id: id.data,
          oldSlugs: [],
          values: initial.values,
          attachment: initial.media.attachmentId ?? null,
          content: initial.content,
          status: initial.status,
          publishedAt: null,
          slug: initial.slug,
        }}
        cancelHref="/admin/announcements"
      />
    </>
  );
}
