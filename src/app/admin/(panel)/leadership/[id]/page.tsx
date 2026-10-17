import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { PageHeader } from "@/components/admin/ui";
import { leaderFields, getLeaderForm } from "@/lib/cms/resources/leaders";
import { recordId } from "@/lib/cms/validation";

import { deleteLeader, saveLeader } from "../actions";

export const metadata: Metadata = { title: "Edit leadership profile" };

export default async function Page({ params }: PageProps<"/admin/leadership/[id]">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const initial = await getLeaderForm(id.data);
  if (!initial) notFound();
  const name = initial.values.name;

  return (
    <>
      <PageHeader
        title="Edit leadership profile"
        description={name}
        actions={
          <DeleteButton
            action={deleteLeader.bind(null, id.data)}
            itemName={name}
            kind="leadership profile"
          />
        }
      />
      <ResourceForm
        action={saveLeader.bind(null, id.data)}
        fields={leaderFields}
        initial={initial}
        submitLabel="Save changes"
        cancelHref="/admin/leadership"
      />
    </>
  );
}
