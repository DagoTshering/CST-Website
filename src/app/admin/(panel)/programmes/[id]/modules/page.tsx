import { notFound, redirect } from "next/navigation";

import { recordId } from "@/lib/cms/validation";

/** A programme's modules are listed on its edit page (this path is in the breadcrumbs). */
export default async function Page({ params }: PageProps<"/admin/programmes/[id]/modules">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  redirect(`/admin/programmes/${id.data}#modules`);
}
