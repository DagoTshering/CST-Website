import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange offices" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="contactOffices"
      group="all"
      title="Arrange offices"
      description="The order of the offices in the Contact page's directory. Drag a row, or use its arrows, then save."
      cancelHref="/admin/contact#offices"
    />
  );
}
