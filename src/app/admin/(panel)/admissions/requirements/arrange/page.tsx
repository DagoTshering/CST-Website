import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange requirements" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="admissionTracks"
      group="all"
      title="Arrange requirements"
      description="The order of the kinds of programme in the Admissions page’s Eligibility section. Drag a row, or use its arrows, then save."
      cancelHref="/admin/admissions#requirements"
    />
  );
}
