import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { listCategoryOptions } from "@/lib/cms/resources/downloads";

export const metadata: Metadata = { title: "Arrange downloads" };

export default async function Page({ searchParams }: PageProps<"/admin/downloads/arrange">) {
  const [{ category }, categories] = await Promise.all([searchParams, listCategoryOptions()]);
  const selected = categories.find((c) => String(c.id) === category) ?? categories[0];
  if (!selected) {
    return (
      <ArrangePage
        list="downloads"
        group="0"
        title="Arrange downloads"
        description="There are no categories yet."
        cancelHref="/admin/downloads"
      />
    );
  }
  return (
    <ArrangePage
      list="downloads"
      group={String(selected.id)}
      title={`Arrange downloads — ${selected.name}`}
      description={
        selected.groupByProgramme
          ? "The order of the downloads within each programme (the programmes follow Academic Programmes’ order). Drag a row, or use its arrows, then save."
          : "The order of the downloads in this category on the Downloads page. Drag a row, or use its arrows, then save."
      }
      cancelHref={`/admin/downloads?category=${selected.id}`}
      groups={categories.map((c) => ({
        label: c.name,
        href: `/admin/downloads/arrange?category=${c.id}`,
        active: c.id === selected.id,
      }))}
    />
  );
}
