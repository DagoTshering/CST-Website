import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange categories" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="downloadCategories"
      group="all"
      title="Arrange categories"
      description="The order of the categories on the Downloads page. Drag a row, or use its arrows, then save."
      cancelHref="/admin/downloads/categories"
    />
  );
}
