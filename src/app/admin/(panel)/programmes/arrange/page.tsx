import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange programmes" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="programmes"
      group="all"
      title="Arrange programmes"
      description="The order of the programmes on the website (the homepage lists undergraduate and postgraduate ones separately, each in this order). Drag a row, or use its arrows, then save."
      cancelHref="/admin/programmes"
    />
  );
}
