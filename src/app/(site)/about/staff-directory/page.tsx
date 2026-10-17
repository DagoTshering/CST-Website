import type { Metadata } from "next";

import { StaffDirectory } from "@/components/staff/StaffDirectory";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { departments, staff } from "@/content/staff";

// The directory is read from src/content/staff.json at build time: keep the page prerendered.
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Staff Directory",
  description: `Find any of the ${staff.length} academic and support staff of the ${site.name}, ${site.university}, by name or department: their roles, programmes and email addresses.`,
};

export default function StaffDirectoryPage() {
  return (
    <div className="bg-paper-soft">
      <PageHeader
        title="Staff Directory"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About Us" },
          { label: "Staff Directory" },
        ]}
        intro={`${staff.length} people across ${departments.length} departments and units at the ${site.name}.`}
      />
      <StaffDirectory staff={staff} departments={departments} />
    </div>
  );
}
