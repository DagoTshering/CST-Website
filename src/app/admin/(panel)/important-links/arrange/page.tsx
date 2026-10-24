import type { Metadata } from "next";

import { ArrangePage } from "@/components/admin/ArrangePage";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Arrange links" };

export default async function Page() {
  await requireAdmin();
  return (
    <ArrangePage
      list="importantLinks"
      group="all"
      title="Arrange links"
      description="The order of the links under Others › Important Links in the site's menu. Drag a row, or use its arrows, then save."
      cancelHref="/admin/important-links"
    />
  );
}
