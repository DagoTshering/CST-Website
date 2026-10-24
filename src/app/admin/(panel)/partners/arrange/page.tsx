import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";
import { PARTNER_CATEGORIES } from "@/lib/cms/resources/partners";

export const metadata: Metadata = { title: "Arrange partners" };

export default async function Page({ searchParams }: PageProps<"/admin/partners/arrange">) {
  await requireAdmin();
  const { category } = await searchParams;
  const selected = PARTNER_CATEGORIES.find((c) => c.value === category) ?? PARTNER_CATEGORIES[0];
  return (
    <ArrangePage
      list="partners"
      group={selected.value}
      title={`Arrange partners — ${selected.label}`}
      description="The order of the partners within each country or type on the Partners page. Drag a row, or use its arrows, then save. Choose the other category above."
      cancelHref={`/admin/partners?category=${selected.value}`}
      showPhotos
      groups={PARTNER_CATEGORIES.map((c) => ({
        label: c.label,
        href: `/admin/partners/arrange?category=${c.value}`,
        active: c.value === selected.value,
      }))}
    />
  );
}
