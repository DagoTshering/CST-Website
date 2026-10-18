import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange facilities" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="facilities"
      group="all"
      title="Arrange facilities"
      description="The order of the facilities in the homepage’s carousel. Drag a row, or use its arrows, then save."
      cancelHref="/admin/facilities"
      showPhotos
    />
  );
}
