import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange questions" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="admissionFaqs"
      group="all"
      title="Arrange questions"
      description="The order of the questions on the Admissions page. Drag a row, or use its arrows, then save."
      cancelHref="/admin/admissions#faq"
    />
  );
}
