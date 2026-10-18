import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";
import { PROGRAMME_LEVELS } from "@/lib/cms/resources/programmes";

export const metadata: Metadata = { title: "Arrange programmes" };

export default async function Page({ searchParams }: PageProps<"/admin/programmes/arrange">) {
  await requireAdmin();
  const { level } = await searchParams;
  const selected = PROGRAMME_LEVELS.find((l) => l.value === level) ?? PROGRAMME_LEVELS[0];
  return (
    <ArrangePage
      list="programmes"
      group={selected.value}
      title={`Arrange programmes — ${selected.label}`}
      description="The order of these programmes on the website: the homepage, the Programmes page and wherever programmes are listed. Undergraduate and postgraduate programmes are always shown apart, so each level has its own order (choose the other above). Drag a row, or use its arrows, then save."
      cancelHref="/admin/programmes"
      groups={PROGRAMME_LEVELS.map((l) => ({
        label: l.label,
        href: `/admin/programmes/arrange?level=${l.value}`,
        active: l.value === selected.value,
      }))}
    />
  );
}
