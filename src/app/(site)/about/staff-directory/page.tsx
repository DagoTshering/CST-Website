import type { Metadata } from "next";
import { Suspense } from "react";

import { StaffDirectory } from "@/components/staff/StaffDirectory";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedStaffDirectory } from "@/lib/cms/resources/staff";

export const metadata: Metadata = {
  title: "Staff Directory",
  description: `Find any of the academic and support staff of the ${site.name}, ${site.university}, by name or department: their roles, programmes and email addresses.`,
};

/** The directory itself: read from the database at request time (Admin › Staff Directory). */
async function Directory() {
  const result = await loadPublished("staff directory", getPublishedStaffDirectory);
  if (!result.ok) {
    return (
      <p className="container-page py-16 text-copy">
        The staff directory cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  if (result.data.staff.length === 0) {
    return <p className="container-page py-16 text-copy">No staff are listed at the moment.</p>;
  }
  return <StaffDirectory staff={result.data.staff} departments={result.data.departments} />;
}

export default function StaffDirectoryPage() {
  return (
    <div className="bg-white">
      <PageHeader title="Staff Directory" />
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[60vh] py-16" />}>
        <Directory />
      </Suspense>
    </div>
  );
}
