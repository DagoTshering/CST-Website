import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { announcementFields, getAnnouncementForm } from "@/lib/cms/resources/announcements";
import { recordId } from "@/lib/cms/validation";

import { deleteAnnouncement, saveAnnouncement } from "../actions";

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
      <ResourceForm
        action={saveAnnouncement.bind(null, id.data)}
        fields={announcementFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/announcements"
      />
    </>
  );
}
