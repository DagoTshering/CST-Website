import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange departments" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="departments"
      group="all"
      title="Arrange departments"
      description="The order of the departments in the Staff Directory. Drag a row, or use its arrows, then save."
      cancelHref="/admin/staff/departments"
    />
  );
}
