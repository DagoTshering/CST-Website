import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { getProgrammeName } from "@/lib/cms/resources/programme-pages";
import { recordId } from "@/lib/cms/validation";

export const metadata: Metadata = { title: "Arrange modules" };

export default async function Page({
  params,
}: PageProps<"/admin/programmes/[id]/modules/arrange">) {
  const id = recordId.safeParse((await params).id);
  if (!id.success) notFound();
  const name = await getProgrammeName(id.data);
  if (name === null) notFound();
  return (
    <ArrangePage
      list="programmeModules"
      group={String(id.data)}
      title="Arrange modules"
      description={`The order of the modules on the programme page of ${name}. Drag a row, or use its arrows, then save.`}
      cancelHref={`/admin/programmes/${id.data}#modules`}
    />
  );
}
