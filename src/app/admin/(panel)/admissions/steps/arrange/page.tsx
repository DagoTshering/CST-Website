import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange steps" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="admissionStepTypes"
      group="all"
      title="Arrange steps"
      description="The order of the steps in the list offered when a date is added. (The Admissions page shows the dates in order of date.) Drag a row, or use its arrows, then save."
      cancelHref="/admin/admissions/steps"
    />
  );
}
