import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";
import { CENTRE_GROUPS } from "@/lib/cms/resources/about-page";

export const metadata: Metadata = { title: "Arrange centres" };

export default async function Page({
  searchParams,
}: PageProps<"/admin/about-page/centres/arrange">) {
  await requireAdmin();
  const { group } = await searchParams;
  const selected = CENTRE_GROUPS.find((g) => g.value === group) ?? CENTRE_GROUPS[0];
  return (
    <ArrangePage
      list="centres"
      group={selected.value}
      title={`Arrange centres — ${selected.label}`}
      description="The order of these centres on the About page. Research centres and innovation centres are listed apart, so each has its own order (choose the other above). Drag a row, or use its arrows, then save."
      cancelHref="/admin/about-page#centres"
      showPhotos
      groups={CENTRE_GROUPS.map((g) => ({
        label: g.label,
        href: `/admin/about-page/centres/arrange?group=${g.value}`,
        active: g.value === selected.value,
      }))}
    />
  );
}
