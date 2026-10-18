import type { Metadata } from "next";
import { Suspense } from "react";

import { ExecutivesChart } from "@/components/executives/ExecutivesChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedExecutives } from "@/lib/cms/resources/executives";

export const metadata: Metadata = {
  title: "Our Executives",
  description: `The executive leadership of the ${site.name}, ${site.university}: the President and the Deans.`,
};

/** The chart: read from the database at request time (Admin › Executives). */
async function Chart() {
  const result = await loadPublished("executives", getPublishedExecutives);
  if (!result.ok) {
    return (
      <p className="py-16 text-copy">
        The executives cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  const { president, deans } = result.data;
  if (!president && deans.length === 0) {
    return <p className="py-16 text-copy">No executives are listed at the moment.</p>;
  }
  return <ExecutivesChart president={president} deans={deans} />;
}

export default function ExecutivesPage() {
  return (
    <div className="bg-white">
      <PageHeader title="Our Executives" intro={`Executive leadership of the ${site.name}.`} />
      <div className="container-page pt-2">
        <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
          <Chart />
        </Suspense>
      </div>
    </div>
  );
}
