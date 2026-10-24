import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange links" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="contactSocial"
      group="all"
      title="Arrange links"
      description="The order of the links under Find us online on the Contact page. Drag a row, or use its arrows, then save."
      cancelHref="/admin/contact#online"
    />
  );
}
