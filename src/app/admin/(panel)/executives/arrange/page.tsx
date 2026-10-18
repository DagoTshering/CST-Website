import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange executives" };

const ROWS = [
  { level: "2", label: "Row below (Deans)" },
  { level: "1", label: "Head of the chart" },
];

export default async function Page({ searchParams }: PageProps<"/admin/executives/arrange">) {
  await requireAdmin();
  const { level } = await searchParams;
  const row = ROWS.find((r) => r.level === level) ?? ROWS[0];
  return (
    <ArrangePage
      list="executives"
      group={row.level}
      title={`Arrange executives — ${row.label}`}
      description="Left to right on the Executives page. Drag a row, or use its arrows, then save. (The first at the head of the chart is the one featured on the homepage.)"
      cancelHref="/admin/executives"
      showPhotos
      groups={ROWS.map((r) => ({
        label: r.label,
        href: `/admin/executives/arrange?level=${r.level}`,
        active: r.level === row.level,
      }))}
    />
  );
}
